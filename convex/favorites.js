import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Récupérer la liste
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé : Vous devez être connecté.");
    }

    const favorites = await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    return favorites;
  },
});

// 2. Ajouter un favori
export const add = mutation({
  args: {
    name: v.string(),
    calories: v.number(),
    proteins: v.number(),
    carbs: v.number(),
    fats: v.number(),
    originalData: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    await ctx.db.insert("favorites", {
      userId: identity.tokenIdentifier,
      name: args.name,
      calories: args.calories,
      proteins: args.proteins,
      carbs: args.carbs,
      fats: args.fats,
      originalData: args.originalData,
    });
  },
});

// 👇 3. LA FONCTION MANQUANTE : Supprimer un favori 👇
export const remove = mutation({
  args: { id: v.id("favorites") }, // On attend l'ID unique du favori
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    // Hop, on supprime la ligne dans la base de données
    await ctx.db.delete(args.id);
  },
});