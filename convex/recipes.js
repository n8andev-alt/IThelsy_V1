import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("recipes")
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    calories: v.number(),
    proteins: v.number(),
    carbs: v.number(),
    fats: v.number(),
    prepTime: v.optional(v.string()),
   cookTime: v.optional(v.string()),
    image: v.optional(v.string()),
    instructions: v.optional(v.array(v.string())),
    ingredients: v.array(v.object({
      name: v.string(),
      quantityLabel: v.string(),
      calories: v.number(),
      proteins: v.number(),
      carbs: v.number(),
      fats: v.number(),
    })),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Pas connecté");

    // On s'assure que l'image n'est pas "null" (car Convex n'aime pas null si c'est optionnel string)
    const dataToSave = { ...args, userId: identity.tokenIdentifier };
    if (!dataToSave.image) delete dataToSave.image;

    await ctx.db.insert("recipes", dataToSave);
  },
});

export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("recipes"),
    title: v.string(),
    calories: v.number(),
    proteins: v.number(),
    carbs: v.number(),
    fats: v.number(),
    prepTime: v.optional(v.string()),
    cookTime: v.optional(v.string()),
    image: v.optional(v.string()),
    instructions: v.optional(v.array(v.string())),
    ingredients: v.array(v.object({
      name: v.string(),
      quantityLabel: v.string(),
      calories: v.number(),
      proteins: v.number(),
      carbs: v.number(),
      fats: v.number(),
    })),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    if (!data.image) delete data.image;
    await ctx.db.patch(id, data);
  },
});
export const get = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});