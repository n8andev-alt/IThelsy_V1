import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function normalize(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlève accents
    .trim(); // Enlève espaces avant/après
}

const CATEGORIES_MAP = {
  "Fruits & Légumes": ["pomme", "banane", "poire", "citron", "avocat", "tomate", "carotte", "courgette", "oignon", "ail", "salade", "brocoli", "haricot", "legume", "fruit", "champignon", "echalote", "persil", "basilic", "poivron", "epinard", "concombre", "patate", "melon", "fraise", "framboise"],
  "Viandes & Poissons": ["poulet", "dinde", "boeuf", "steak", "jambon", "porc", "lardon", "saumon", "thon", "cabillaud", "crevette", "poisson", "viande", "tofu", "canard", "hache", "saucisse"],
  "Frais & Laitages": ["oeuf", "lait", "yaourt", "fromage", "beurre", "creme", "skyr", "mozzarella", "emmental", "comte", "gruyere", "parmesan", "chevre", "blanc", "brie", "raclette", "feta"],
  "Épicerie": ["riz", "pate", "pain", "farine", "sucre", "sel", "poivre", "huile", "vinaigre", "sauce", "epice", "chocolat", "miel", "flocon", "amande", "noix", "cajou", "mayo", "ketchup", "moutarde", "bouillon", "levure", "maizena", "cacao", "biscuit", "conserve", "lentille", "pois"],
};

function getCategory(name) {
  const cleanName = normalize(name);
  for (const [cat, keywords] of Object.entries(CATEGORIES_MAP)) {
    if (keywords.some(k => cleanName.includes(k))) return cat;
  }
  return "Divers";
}

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("shoppingItems").filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier)).collect();
  },
});

// FONCTION D'AJOUT INTELLIGENT
export const addSmartItems = mutation({
  args: { 
    items: v.array(v.object({
        name: v.string(),
        quantityLabel: v.string() 
    })) 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Pas connecté");

    // 1. On récupère la liste DÉJÀ EXISTANTE pour fusionner avec !
    const existingItems = await ctx.db
        .query("shoppingItems")
        .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
        .collect();

    // On prépare une map avec les items existants pour les mettre à jour
    const aggMap = {};
    const ALLOWED_UNITS = ['g', 'kg', 'ml', 'cl', 'l', 'pcs', 'pièce', 'pièces'];

    // A. On indexe l'existant
    for (const item of existingItems) {
        // On essaie de retrouver la clé (Nom + Unité) à partir du texte stocké
        // Ex: "Riz (300 g)" -> Nom: Riz, Val: 300, Unit: g
        const match = item.text.match(/^(.*)\s\((\d+(\.\d+)?)\s*([a-zA-Z\.]*)\)$/);
        let key, data;
        
        if (match) {
            // C'est un item avec quantité
            const name = normalize(match[1]);
            const unit = match[4].toLowerCase();
            key = `${name}_${unit}`;
            data = { id: item._id, name: match[1], val: parseFloat(match[2]), unit: unit, showQuantity: true, category: item.category };
        } else {
            // C'est un item simple (ex: "Sel")
            const name = normalize(item.text);
            key = `${name}_simple`;
            data = { id: item._id, name: item.text, val: 0, unit: '', showQuantity: false, category: item.category };
        }
        aggMap[key] = data;
    }

    // B. On traite les nouveaux items
    for (const newItem of args.items) {
        let cleanNameDisplay = newItem.name.split('(')[0].trim(); // Pour affichage (ex: Pâtes)
        let cleanNameKey = normalize(cleanNameDisplay); // Pour clé (ex: pates)

        let qtyVal = 0;
        let qtyUnit = "";
        let showQuantity = true;

        const match = newItem.quantityLabel ? newItem.quantityLabel.match(/^(\d+(\.\d+)?)\s*([a-zA-Z\.]*)/) : null;
        
        if (match) {
            qtyVal = parseFloat(match[1]);
            qtyUnit = match[3].toLowerCase();
            if (qtyUnit === "") qtyUnit = "pièce(s)";
        } else {
            showQuantity = false;
        }

        if (!ALLOWED_UNITS.includes(qtyUnit)) showQuantity = false;

        const key = showQuantity ? `${cleanNameKey}_${qtyUnit}` : `${cleanNameKey}_simple`;

        if (aggMap[key]) {
            // SI EXISTE DÉJÀ : ON ADDITIONNE
            if (showQuantity) {
                aggMap[key].val += qtyVal;
            }
            // Si pas de quantité (ex: Sel), on ne fait rien, on l'a déjà
        } else {
            // SINON : ON CRÉE
            aggMap[key] = { 
                name: cleanNameDisplay, 
                val: qtyVal, 
                unit: qtyUnit,
                showQuantity: showQuantity,
                isNew: true // Marqueur pour savoir qu'il faut l'insérer
            };
        }
    }

    // C. SAUVEGARDE (Update ou Insert)
    const finalItems = Object.values(aggMap);
    
    for (const item of finalItems) {
       const cat = item.category || getCategory(item.name);
       const finalLabel = item.showQuantity 
            ? `${item.name} (${item.val} ${item.unit})`
            : item.name;
       
       if (item.id) {
           // Mise à jour de l'existant (Nouvelle quantité)
           // On ne touche que si le texte a changé (optimisation)
           await ctx.db.patch(item.id, { text: finalLabel });
       } else if (item.isNew) {
           // Insertion du nouveau
           await ctx.db.insert("shoppingItems", {
              userId: identity.tokenIdentifier,
              text: finalLabel,
              category: cat,
              isChecked: false
           });
       }
    }
  },
});

export const toggle = mutation({
  args: { id: v.id("shoppingItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, { isChecked: !item.isChecked });
  },
});

export const addManual = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const cat = getCategory(args.text);
    await ctx.db.insert("shoppingItems", { userId: identity.tokenIdentifier, text: args.text, category: cat, isChecked: false });
  },
});

export const clear = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const items = await ctx.db.query("shoppingItems").filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier)).collect();
    for (const item of items) await ctx.db.delete(item._id);
  },
});
// AJOUT POUR SUPPRIMER UN SEUL ITEM
export const removeOne = mutation({
  args: { id: v.id("shoppingItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});