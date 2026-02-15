import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// AJOUTER UN REPAS + MISE À JOUR INTELLIGENTE DU STREAK
export const add = mutation({
  args: {
    name: v.string(),
    calories: v.number(),
    proteins: v.number(),
    carbs: v.number(),
    fats: v.number(),
    type: v.string(),
    date: v.string(),
    isComplexMeal: v.optional(v.boolean()),
    ingredients: v.optional(v.array(v.object({
      name: v.string(),
      quantityLabel: v.string(),
      calories: v.number(),
      proteins: v.number(),
      carbs: v.number(),
      fats: v.number(),
      // 🔥 CHAMPS SUPPLÉMENTAIRES TOLÉRÉS (mais pas stockés)
      baseC: v.optional(v.number()),
      baseCal: v.optional(v.number()),
      baseF: v.optional(v.number()),
      baseP: v.optional(v.number()),
      weight: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Pas connecté");

    // 🔥 NETTOIE LES INGRÉDIENTS AVANT STOCKAGE
    let cleanedIngredients = undefined;
    if (args.ingredients) {
      cleanedIngredients = args.ingredients.map(ing => ({
        name: ing.name,
        quantityLabel: ing.quantityLabel,
        calories: ing.calories,
        proteins: ing.proteins,
        carbs: ing.carbs,
        fats: ing.fats,
        // ❌ On ignore baseC, baseCal, baseF, baseP, weight
      }));
    }

    // 1. AJOUT DU REPAS (avec ingrédients nettoyés)
    await ctx.db.insert("meals", {
      userId: identity.tokenIdentifier,
      name: args.name,
      calories: args.calories,
      proteins: args.proteins,
      carbs: args.carbs,
      fats: args.fats,
      type: args.type,
      date: args.date,
      isComplexMeal: args.isComplexMeal,
      ingredients: cleanedIngredients,
    });

    // 2. RÉCUPÉRATION DE L'UTILISATEUR
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) return;

    // 3. MISE À JOUR DES STATS QUOTIDIENNES (Cache optimisé)
    const existingStat = await ctx.db
      .query("dailyStats")
      .filter(q => q.and(
        q.eq(q.field("userId"), identity.tokenIdentifier),
        q.eq(q.field("date"), args.date)
      ))
      .first();

    // Calcul des nouveaux totaux
    const dailyMeals = await ctx.db
      .query("meals")
      .filter(q => q.and(
        q.eq(q.field("userId"), identity.tokenIdentifier),
        q.eq(q.field("date"), args.date)
      ))
      .collect();

    let totalCals = 0;
    let totalProts = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    dailyMeals.forEach(meal => {
      totalCals += meal.calories;
      totalProts += meal.proteins;
      totalCarbs += meal.carbs;
      totalFats += meal.fats;
    });

    // 4. LOGIQUE DU STREAK (Tolérance 10%)
    const calMin = user.caloriesGoal * 0.9;
    const calMax = user.caloriesGoal * 1.1;
    const protMin = user.proteinsGoal * 0.9;
    const protMax = user.proteinsGoal * 1.1;

    const isGoalMet = 
      totalCals >= calMin && 
      totalCals <= calMax && 
      totalProts >= protMin && 
      totalProts <= protMax;

    // Mise à jour ou création de la stat quotidienne
    const wasValidated = existingStat?.streakValidated === true;
    if (existingStat) {
      await ctx.db.patch(existingStat._id, {
        calories: totalCals,
        proteins: totalProts,
        carbs: totalCarbs,
        fats: totalFats,
        streakValidated: isGoalMet,
        lastMealTime: new Date().toISOString()
      });
    } else {
      await ctx.db.insert("dailyStats", {
        userId: identity.tokenIdentifier,
        date: args.date,
        calories: totalCals,
        proteins: totalProts,
        carbs: totalCarbs,
        fats: totalFats,
        water: 0,
        weight: user.weight,
        streakValidated: isGoalMet,
        lastMealTime: new Date().toISOString()
      });
    }

    // 5. ATTRIBUTION/RETRAIT DE LA POMME
    if (isGoalMet && user.lastNutritionStreakDate !== args.date) {
      await ctx.db.patch(user._id, {
        streakNutrition: (user.streakNutrition || 0) + 1,
        lastNutritionStreakDate: args.date,
      });
      return { success: true, streakIncreased: true };
    }

    if (!isGoalMet && wasValidated && user.lastNutritionStreakDate === args.date) {
      await ctx.db.patch(user._id, {
        streakNutrition: Math.max((user.streakNutrition || 0) - 1, 0),
        lastNutritionStreakDate: ""
      });
      return { success: true, streakRevoked: true };
    }

    return { success: true, streakIncreased: false };
  },
});

// RÉCUPÉRER LES REPAS DU JOUR
export const getToday = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    return await ctx.db
      .query("meals")
      .filter(q => q.and(
        q.eq(q.field("userId"), identity.tokenIdentifier), 
        q.eq(q.field("date"), args.date)
      ))
      .collect();
  },
});

// SUPPRIMER UN REPAS (avec recalcul automatique)
export const remove = mutation({
  args: { id: v.id("meals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Pas connecté");

    const meal = await ctx.db.get(args.id);
    if (!meal) return;

    await ctx.db.delete(args.id);

    const dailyMeals = await ctx.db
      .query("meals")
      .filter(q => q.and(
        q.eq(q.field("userId"), identity.tokenIdentifier),
        q.eq(q.field("date"), meal.date)
      ))
      .collect();

    let totalCals = 0;
    let totalProts = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    dailyMeals.forEach(m => {
      totalCals += m.calories;
      totalProts += m.proteins;
      totalCarbs += m.carbs;
      totalFats += m.fats;
    });

    const stat = await ctx.db
      .query("dailyStats")
      .filter(q => q.and(
        q.eq(q.field("userId"), identity.tokenIdentifier),
        q.eq(q.field("date"), meal.date)
      ))
      .first();

    if (stat) {
      await ctx.db.patch(stat._id, {
        calories: totalCals,
        proteins: totalProts,
        carbs: totalCarbs,
        fats: totalFats
      });
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (user) {
      const calMin = user.caloriesGoal * 0.9;
      const calMax = user.caloriesGoal * 1.1;
      const protMin = user.proteinsGoal * 0.9;
      const protMax = user.proteinsGoal * 1.1;

      const isGoalMet =
        totalCals >= calMin &&
        totalCals <= calMax &&
        totalProts >= protMin &&
        totalProts <= protMax;

      if (stat) {
        await ctx.db.patch(stat._id, { streakValidated: isGoalMet });
      }

      if (!isGoalMet && user.lastNutritionStreakDate === meal.date) {
        await ctx.db.patch(user._id, {
          streakNutrition: Math.max((user.streakNutrition || 0) - 1, 0),
          lastNutritionStreakDate: ""
        });
      }
    }
  },
});

// RÉCUPÉRER TOUS LES REPAS
export const getAll = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    return await ctx.db
      .query("meals")
      .filter(q => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();
  },
});