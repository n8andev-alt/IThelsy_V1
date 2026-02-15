import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    picture: v.optional(v.string()),
    goal: v.string(),
    sex: v.string(),
    age: v.number(),
    weight: v.number(),
    weightGoal: v.optional(v.number()), 
    height: v.number(),
    activityLevel: v.string(),
    dietType: v.string(),
    difficulty: v.optional(v.string()),
    caloriesGoal: v.number(),
    proteinsGoal: v.number(),
    carbsGoal: v.number(),
    fatsGoal: v.number(),
    waterGoal: v.number(),
    streakNutrition: v.number(),
    bestStreak: v.optional(v.number()),
    streakSport: v.number(),
    streakFreezes: v.optional(v.number()),
    lastNutritionStreakDate: v.optional(v.string()),
    isPremium: v.boolean(),
    dailyAiCount: v.optional(v.number()),
    lastAiDate: v.optional(v.string()),

    friendCode: v.optional(v.string()),
    gymBroId: v.optional(v.id("users")),
    gymBroCode: v.optional(v.string()),
    // ❌ hasGymBroDiscount SUPPRIMÉ

    allergies: v.optional(v.array(v.string())),
    bedTime: v.optional(v.string()),
    wakeTime: v.optional(v.string()),
    hasSeenTutorial: v.optional(v.boolean()),
    
    motivation: v.optional(v.string()),
    sleepHours: v.optional(v.number()),
    
    primaryGoal: v.optional(v.string()),
    secondaryGoals: v.optional(v.array(v.string())),
    
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
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_gymBroCode", ["gymBroCode"]),

  meals: defineTable({
    userId: v.string(),
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
    }))),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  favorites: defineTable({
    userId: v.string(),
    name: v.string(),
    calories: v.number(),
    proteins: v.number(),
    carbs: v.number(),
    fats: v.number(),
    originalData: v.any(), 
  })
    .index("by_user", ["userId"]),

  recipes: defineTable({
    userId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()), 
    instructions: v.optional(v.array(v.string())),
    calories: v.number(),
    proteins: v.number(),
    carbs: v.number(),
    fats: v.number(),
    prepTime: v.optional(v.string()),
    cookTime: v.optional(v.string()),
    ingredients: v.array(v.object({
      name: v.string(),
      quantityLabel: v.string(),
      calories: v.number(),
      proteins: v.number(),
      carbs: v.number(),
      fats: v.number(),
    })),
    tags: v.array(v.string()),
  })
    .index("by_user", ["userId"]),

  shoppingItems: defineTable({
    userId: v.string(),
    text: v.string(),
    category: v.optional(v.string()),
    isChecked: v.boolean(),
  })
    .index("by_user", ["userId"]),

  dailyStats: defineTable({
    userId: v.string(),
    date: v.string(),
    calories: v.number(),
    proteins: v.number(),
    carbs: v.optional(v.number()),
    fats: v.optional(v.number()),
    water: v.number(),
    weight: v.optional(v.number()),
    streakValidated: v.optional(v.boolean()),
    lastMealTime: v.optional(v.string())
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),
});