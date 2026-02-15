import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 🔥 Lier deux users GymBro
export const linkGymBro = mutation({
  args: { gymBroCode: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    // Trouver l'user actuel
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!currentUser) throw new Error("Utilisateur non trouvé");
    if (currentUser.gymBroId) throw new Error("Vous êtes déjà lié à un GymBro");

    // Trouver le GymBro par code
    const gymBro = await ctx.db
      .query("users")
      .withIndex("by_gymBroCode", q => q.eq("gymBroCode", args.gymBroCode))
      .unique();

    if (!gymBro) throw new Error("Code GymBro invalide");
    if (gymBro._id === currentUser._id) throw new Error("Vous ne pouvez pas vous lier à vous-même");
    if (gymBro.gymBroId) throw new Error("Ce GymBro est déjà lié à quelqu'un");

    // 🔥 LIER LES DEUX USERS (sans hasGymBroDiscount)
    await ctx.db.patch(currentUser._id, {
      gymBroId: gymBro._id,
    });

    await ctx.db.patch(gymBro._id, {
      gymBroId: currentUser._id,
    });

    return { success: true };
  },
});

// 🔥 Délier deux users GymBro
export const unlinkGymBro = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    // Trouver l'user actuel
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!currentUser) throw new Error("Utilisateur non trouvé");
    if (!currentUser.gymBroId) throw new Error("Vous n'êtes pas lié à un GymBro");

    const gymBroId = currentUser.gymBroId;

    // 🔥 DÉLIER LES DEUX USERS (sans hasGymBroDiscount)
    await ctx.db.patch(currentUser._id, {
      gymBroId: undefined,
    });

    await ctx.db.patch(gymBroId, {
      gymBroId: undefined,
    });

    return { success: true };
  },
});

// 🔥 Récupérer la progression GymBro
export const getGymBroProgress = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!currentUser || !currentUser.gymBroId) return null;

    const gymBro = await ctx.db.get(currentUser.gymBroId);
    if (!gymBro) return null;

    return {
      currentUser: {
        name: currentUser.name,
        streakNutrition: currentUser.streakNutrition || 0,
      },
      gymBro: {
        name: gymBro.name,
        streakNutrition: gymBro.streakNutrition || 0,
      },
    };
  },
});