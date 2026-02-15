import { mutation } from "./_generated/server";

// 🔥 MIGRATION AGRESSIVE : Nettoyer complètement hasGymBroDiscount
export const forceCleanupGymBroDiscount = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    let cleaned = 0;
    
    for (const user of users) {
      // Force la reconstruction de l'objet user SANS hasGymBroDiscount
      const cleanUser = {
        activityLevel: user.activityLevel,
        age: user.age,
        allergies: user.allergies,
        bedTime: user.bedTime,
        bestStreak: user.bestStreak,
        caloriesGoal: user.caloriesGoal,
        carbsGoal: user.carbsGoal,
        dailyAiCount: user.dailyAiCount,
        dietType: user.dietType,
        difficulty: user.difficulty,
        email: user.email,
        fatsGoal: user.fatsGoal,
        friendCode: user.friendCode,
        goal: user.goal,
        gymBroCode: user.gymBroCode,
        gymBroId: user.gymBroId,
        hasSeenTutorial: user.hasSeenTutorial,
        height: user.height,
        isPremium: user.isPremium,
        lastAiDate: user.lastAiDate,
        lastNutritionStreakDate: user.lastNutritionStreakDate,
        motivation: user.motivation,
        name: user.name,
        performances: user.performances,
        picture: user.picture,
        primaryGoal: user.primaryGoal,
        proteinsGoal: user.proteinsGoal,
        secondaryGoals: user.secondaryGoals,
        sex: user.sex,
        sleepHours: user.sleepHours,
        sports: user.sports,
        streakFreezes: user.streakFreezes,
        streakNutrition: user.streakNutrition,
        streakSport: user.streakSport,
        tokenIdentifier: user.tokenIdentifier,
        wakeTime: user.wakeTime,
        waterGoal: user.waterGoal,
        weight: user.weight,
        weightGoal: user.weightGoal,
      };
      
      // Remplacer complètement l'user (garde le même _id)
      await ctx.db.replace(user._id, cleanUser);
      
      cleaned++;
    }
    
    return { 
      message: `✅ Migration FORCE terminée`,
      totalUsers: users.length,
      usersRecreated: cleaned
    };
  },
});