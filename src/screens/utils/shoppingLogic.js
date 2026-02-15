// Liste de mots-clés pour deviner la catégorie
const CATEGORIES = {
  "Fruits & Légumes": ['pomme', 'banane', 'poire', 'fraise', 'citron', 'avocat', 'tomate', 'carotte', 'courgette', 'oignon', 'ail', 'salade', 'brocoli', 'légume', 'fruit'],
  "Viandes & Poissons": ['poulet', 'dinde', 'boeuf', 'steak', 'jambon', 'porc', 'lardons', 'saumon', 'thon', 'cabillaud', 'crevette', 'poisson', 'viande', 'tofu'],
  "Frais & Laitages": ['oeuf', 'lait', 'yaourt', 'fromage', 'beurre', 'crème', 'skyr', 'mozzarella', 'emmental', 'comté'],
  "Épicerie": ['riz', 'pates', 'pâtes', 'pain', 'farine', 'sucre', 'sel', 'poivre', 'huile', 'vinaigre', 'sauce', 'épice', 'chocolat', 'miel', 'flocons', 'amande', 'noix'],
};

export function getCategory(itemName) {
  const lowerName = itemName.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => lowerName.includes(k))) return cat;
  }
  return "Divers";
}

// Fonction pour extraire le nombre et l'unité d'une chaine (ex: "200 g" -> {val: 200, unit: "g"})
export function parseQuantity(qtyString) {
  if (!qtyString) return { val: 0, unit: '' };
  
  // Regex simple pour trouver les chiffres au début
  const match = qtyString.match(/^(\d+(\.\d+)?)\s*([a-zA-Z\.]*)/);
  if (match) {
    return { 
      val: parseFloat(match[1]), 
      unit: match[3].toLowerCase() 
    };
  }
  return { val: 1, unit: 'paquet' }; // Par défaut
}