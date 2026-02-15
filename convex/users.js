import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ═══════════════════════════════════════════════════════════════════
// 🧮 FONCTION DE CALCUL DU PLAN (centralisée)
// ═══════════════════════════════════════════════════════════════════
function calculateNutritionPlan(userData) {
  const weight = userData.weight || 70;
  const height = userData.height || 175;
  const age = userData.age || 25;
  const sex = userData.sex || "homme";
  const goal = (userData.goal || userData.primaryGoal || "maintain").toLowerCase();
  const activity = (userData.activityLevel || "moderate").toLowerCase();
  const difficulty = (userData.difficulty || "normal").toLowerCase();
  const sports = userData.sports || [];
  const sleepHours = userData.sleepHours || 7;

  // 1️⃣ BMR (Métabolisme de base)
  let bmr;
  if (sex.toLowerCase().includes("femme") || sex === "f") {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  }

  // 2️⃣ TDEE (Dépense énergétique totale avec activité quotidienne)
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryactive: 1.9
  };
  let tdee = bmr * (activityMultipliers[activity] || 1.55);

  // 3️⃣ BONUS SPORT (ajouter des calories en fonction des sports pratiqués)
  sports.forEach((sport) => {
    const freq = parseInt(sport.frequency) || 0;
    let levelBonus = 1.1; // intermediate par défaut
    
    if (sport.level === "advanced") levelBonus = 1.15;
    else if (sport.level === "beginner") levelBonus = 1.05;
    
    // Ajouter ~50-75 kcal par séance selon le niveau
    tdee += freq * 50 * levelBonus;
  });

  // 4️⃣ AJUSTEMENT SOMMEIL
  if (sleepHours < 6) {
    tdee *= 0.98; // Moins de récupération = métabolisme légèrement ralenti
  } else if (sleepHours > 8) {
    tdee *= 1.02; // Meilleure récupération
  }

  // 5️⃣ AJUSTEMENT SELON L'OBJECTIF
  let calorieAdjustment = 0;

  if (goal.includes("lose") || goal.includes("perdre") || goal.includes("cut") || goal.includes("lean") || goal.includes("sec")) {
    // Perte de poids / sèche
    if (difficulty === "cool") calorieAdjustment = -200;
    else if (difficulty === "guerrier" || difficulty === "hard") calorieAdjustment = -800;
    else calorieAdjustment = -500; // normal
    
  } else if (goal.includes("muscle") || goal.includes("masse") || goal.includes("bulk")) {
    // Prise de masse
    if (difficulty === "cool") calorieAdjustment = +150;
    else if (difficulty === "guerrier" || difficulty === "hard") calorieAdjustment = +600;
    else calorieAdjustment = +300; // normal
    
  } else if (goal.includes("stronger") || goal.includes("force")) {
    // Gagner en force (légère prise de masse)
    if (difficulty === "cool") calorieAdjustment = +100;
    else if (difficulty === "guerrier" || difficulty === "hard") calorieAdjustment = +400;
    else calorieAdjustment = +200; // normal
    
  } else if (goal.includes("endurance") || goal.includes("cardio")) {
    // Améliorer l'endurance (maintenance + petit bonus)
    calorieAdjustment = +50;
    
  } else {
    // Maintien / santé
    calorieAdjustment = 0;
  }

  // 6️⃣ AJUSTEMENT OBJECTIFS SECONDAIRES
  const secondaryGoals = userData.secondaryGoals || [];
  secondaryGoals.forEach((secGoal) => {
    if (secGoal.includes("endurance")) calorieAdjustment += 50;
    if (secGoal.includes("muscle")) calorieAdjustment += 100;
  });

  // 7️⃣ CALCUL CALORIES FINALES
  let targetCalories = Math.round(tdee + calorieAdjustment);
  
  // Sécurité : minimum 1200 kcal
  if (targetCalories < 1200) targetCalories = 1200;

  // 8️⃣ MACROS : PROTÉINES
  let proteinFactor = 1.8; // Par défaut

  if (goal.includes("muscle") || goal.includes("masse") || goal.includes("stronger") || goal.includes("force")) {
    proteinFactor = 2.2; // Prise de muscle / force
  } else if (goal.includes("lose") || goal.includes("perdre") || goal.includes("lean") || goal.includes("sec")) {
    proteinFactor = 2.0; // Perte de poids (garder la masse musculaire)
  }

  // Ajustement selon la difficulté
  if (difficulty === "guerrier" || difficulty === "hard") {
    proteinFactor += 0.2;
  } else if (difficulty === "cool") {
    proteinFactor -= 0.2;
  }

  const proteinsGoal = Math.round(weight * proteinFactor);

  // 9️⃣ MACROS : LIPIDES (1g/kg de poids)
  const fatsGoal = Math.round(weight * 1.0);

  // 🔟 MACROS : GLUCIDES (le reste des calories)
  const caloriesFromProteinsAndFats = (proteinsGoal * 4) + (fatsGoal * 9);
  const remainingCalories = targetCalories - caloriesFromProteinsAndFats;
  const carbsGoal = Math.round(Math.max(50, remainingCalories / 4));

  // 💧 EAU : 35ml par kg de poids
  const waterGoal = Math.round(weight * 35);

  return {
    caloriesGoal: targetCalories,
    proteinsGoal,
    carbsGoal,
    fatsGoal,
    waterGoal,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee)
  };
}

// ═══════════════════════════════════════════════════════════════════
// STORE USER (Onboarding)
// ═══════════════════════════════════════════════════════════════════
export const store = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    picture: v.optional(v.string()),
    goal: v.string(),
    sex: v.string(),
    age: v.number(),
    weight: v.number(),
    weightGoal: v.number(),
    height: v.number(),
    activityLevel: v.string(),
    dietType: v.string(),
    caloriesGoal: v.number(),
    proteinsGoal: v.number(),
    carbsGoal: v.number(),
    fatsGoal: v.number(),
    waterGoal: v.number(),
    streakNutrition: v.optional(v.number()),
    streakSport: v.optional(v.number()),
    streakFreezes: v.optional(v.number()),
    isPremium: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Pas connecté !");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    const today = new Date().toISOString().split('T')[0];

    const dataToSave = {
      name: args.name,
      email: args.email,
      picture: args.picture,
      goal: args.goal,
      sex: args.sex,
      age: args.age,
      weight: args.weight,
      weightGoal: args.weightGoal,
      height: args.height,
      activityLevel: args.activityLevel,
      dietType: args.dietType,
      caloriesGoal: args.caloriesGoal,
      proteinsGoal: args.proteinsGoal,
      carbsGoal: args.carbsGoal,
      fatsGoal: args.fatsGoal,
      waterGoal: args.waterGoal,
      isPremium: args.isPremium || false,
    };

    if (user !== null) {
      return await ctx.db.patch(user._id, dataToSave);
    }

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      ...dataToSave,
    });

    await ctx.db.insert("dailyStats", {
      userId: identity.tokenIdentifier,
      date: today,
      weight: args.weight,
      water: 0,
      calories: 0,
      proteins: 0
    });

    return userId;
  },
});

// ═══════════════════════════════════════════════════════════════════
// CHECK USER
// ═══════════════════════════════════════════════════════════════════
export const checkUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();
  },
});

// ═══════════════════════════════════════════════════════════════════
// UPDATE USER DATA
// ═══════════════════════════════════════════════════════════════════
export const updateUserData = mutation({
  args: {
    id: v.optional(v.id("users")),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    picture: v.optional(v.string()),
    goal: v.optional(v.string()),
    sex: v.optional(v.string()),
    age: v.optional(v.number()),
    weight: v.optional(v.number()),
    weightGoal: v.optional(v.number()),
    height: v.optional(v.number()),
    activityLevel: v.optional(v.string()),
    dietType: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    caloriesGoal: v.optional(v.number()),
    proteinsGoal: v.optional(v.number()),
    carbsGoal: v.optional(v.number()),
    fatsGoal: v.optional(v.number()),
    waterGoal: v.optional(v.number()),
    streakNutrition: v.optional(v.number()),
    bestStreak: v.optional(v.number()),
    streakSport: v.optional(v.number()),
    streakFreezes: v.optional(v.number()),
    lastNutritionStreakDate: v.optional(v.string()),
    isPremium: v.optional(v.boolean()),
    hasSeenTutorial: v.optional(v.boolean()),
    allergies: v.optional(v.array(v.string())),
    bedTime: v.optional(v.string()),
    wakeTime: v.optional(v.string()),
    motivation: v.optional(v.string()),
    sleepHours: v.optional(v.number()),
    sports: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      frequency: v.string(),
      level: v.string(),
    }))),
    performances: v.optional(v.object({
      squat: v.optional(v.number()),
      benchPress: v.optional(v.number()),
      deadlift: v.optional(v.number()),
      pullUps: v.optional(v.number()),
      pushUps: v.optional(v.number()),
      plank: v.optional(v.number()),
      waist: v.optional(v.number()),
      run5k: v.optional(v.number()),
      run10k: v.optional(v.number()),
      run20k: v.optional(v.number()),
    })),
    primaryGoal: v.optional(v.string()),
    secondaryGoals: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non connecté");

    let user = null;
    if (args.id) {
      user = await ctx.db.get(args.id);
    } else {
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
        .first();
    }

    const { id, ...dataToUpdate } = args;

    if (user) {
      await ctx.db.patch(user._id, dataToUpdate);
    } else {
      await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        streakNutrition: 0,
        bestStreak: 0,
        streakSport: 0,
        streakFreezes: 3,
        isPremium: false,
        ...dataToUpdate,
      });
    }
  },
});

// ═══════════════════════════════════════════════════════════════════
// 🔥 UPDATE WEIGHT AND GOALS (RECALCUL COMPLET)
// ═══════════════════════════════════════════════════════════════════
export const updateWeightAndGoals = mutation({
  args: {
    newWeight: v.number(),
    newGoal: v.optional(v.string()),
    newActivity: v.optional(v.string()),
    newDifficulty: v.optional(v.string()),
    newHeight: v.optional(v.number()),
    newAge: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non connecté");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User introuvable");

    // 🔥 CONSTRUIRE L'OBJET userData pour le calcul
    const updatedUserData = {
      weight: args.newWeight,
      height: args.newHeight || user.height,
      age: args.newAge || user.age,
      sex: user.sex,
      goal: args.newGoal || user.primaryGoal || user.goal,
      primaryGoal: args.newGoal || user.primaryGoal || user.goal,
      activityLevel: args.newActivity || user.activityLevel,
      difficulty: args.newDifficulty || user.difficulty || "normal",
      sports: user.sports || [],
      sleepHours: user.sleepHours || 7,
      secondaryGoals: user.secondaryGoals || []
    };

    // 🧮 RECALCULER LE PLAN AVEC LA FONCTION CENTRALISÉE
    const plan = calculateNutritionPlan(updatedUserData);

    // 💾 SAUVEGARDER DANS LA BDD
    await ctx.db.patch(user._id, {
      weight: args.newWeight,
      height: updatedUserData.height,
      age: updatedUserData.age,
      goal: updatedUserData.goal,
      primaryGoal: updatedUserData.primaryGoal,
      activityLevel: updatedUserData.activityLevel,
      difficulty: updatedUserData.difficulty,
      caloriesGoal: plan.caloriesGoal,
      proteinsGoal: plan.proteinsGoal,
      fatsGoal: plan.fatsGoal,
      carbsGoal: plan.carbsGoal,
      waterGoal: plan.waterGoal
    });

    // 💾 METTRE À JOUR LE POIDS DU JOUR DANS dailyStats
    const today = new Date().toISOString().split('T')[0];
    const dailyEntry = await ctx.db
      .query("dailyStats")
      .filter(q => q.and(
        q.eq(q.field("userId"), identity.tokenIdentifier),
        q.eq(q.field("date"), today)
      ))
      .first();

    if (dailyEntry) {
      await ctx.db.patch(dailyEntry._id, { weight: args.newWeight });
    } else {
      await ctx.db.insert("dailyStats", {
        userId: identity.tokenIdentifier,
        date: today,
        weight: args.newWeight,
        calories: 0,
        proteins: 0,
        water: 0
      });
    }

    return plan;
  },
});

// ═══════════════════════════════════════════════════════════════════
// AUTRES FONCTIONS (inchangées)
// ═══════════════════════════════════════════════════════════════════
export const logDailyWater = mutation({
  args: { amount: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const today = new Date().toISOString().split('T')[0];
    const existingStat = await ctx.db
      .query("dailyStats")
      .filter(q => q.and(
        q.eq(q.field("userId"), identity.tokenIdentifier),
        q.eq(q.field("date"), today)
      ))
      .first();
    if (existingStat) {
      await ctx.db.patch(existingStat._id, { water: args.amount });
    } else {
      await ctx.db.insert("dailyStats", {
        userId: identity.tokenIdentifier,
        date: today,
        water: args.amount,
        calories: 0,
        proteins: 0
      });
    }
  }
});

export const checkNutritionStreak = mutation({
  args: {},
  handler: async () => ({ status: "ok" }),
});

export const checkAiQuota = mutation({
  args: {},
  handler: async () => ({ success: true })
});

export const generateFriendCode = mutation({
  args: {},
  handler: async () => "CODE"
});

export const linkGymBro = mutation({
  args: { code: v.string() },
  handler: async () => {}
});

export const getGymBroStats = query({
  args: {},
  handler: async () => null
});

export const setPremiumStatus = mutation({
  args: { isPremium: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non connecté");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("Utilisateur introuvable");

    await ctx.db.patch(user._id, {
      isPremium: args.isPremium,
    });
  },
});

export const completeTutorial = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { hasSeenTutorial: true });
    }
  },
});

export const deleteAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non connecté");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
      const meals = await ctx.db
        .query("meals")
        .filter(q => q.eq(q.field("userId"), identity.tokenIdentifier))
        .collect();
      for (const meal of meals) {
        await ctx.db.delete(meal._id);
      }
    }
  },
});

export const logWeight = mutation({
  args: { weight: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non connecté");

    const today = new Date().toISOString().split('T')[0];
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { weight: args.weight });
    }

    const dailyEntry = await ctx.db
      .query("dailyStats")
      .filter(q => q.and(
        q.eq(q.field("userId"), identity.tokenIdentifier),
        q.eq(q.field("date"), today)
      ))
      .first();

    if (dailyEntry) {
      await ctx.db.patch(dailyEntry._id, { weight: args.weight });
    } else {
      await ctx.db.insert("dailyStats", {
        userId: identity.tokenIdentifier,
        date: today,
        weight: args.weight,
        calories: 0,
        proteins: 0,
        water: 0
      });
    }
  },
});