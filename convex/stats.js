import { v } from "convex/values";
import { query } from "./_generated/server";

// ═══════════════════════════════════════════════════════════════════
// 🔥 NOUVELLE QUERY : Récupère les stats du jour actuel (pour l'eau)
// ═══════════════════════════════════════════════════════════════════
export const getToday = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const stat = await ctx.db
      .query("dailyStats")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), identity.tokenIdentifier),
          q.eq(q.field("date"), args.date)
        )
      )
      .first();

    return stat;
  },
});

// ═══════════════════════════════════════════════════════════════════
// RÉCUPÈRE LES STATS SUR X JOURS (Pour le graphique de progression)
// ═══════════════════════════════════════════════════════════════════
export const getStats = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Calcul des dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - args.days);

    // Récupération des données
    const stats = await ctx.db
      .query("dailyStats")
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    // Filtrage par date + tri chronologique
    const filtered = stats
      .filter(s => new Date(s.date) >= startDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Formatage pour le graph
    return filtered.map(stat => ({
      date: formatDateForGraph(stat.date, args.days),
      calories: stat.calories || 0,
      proteins: stat.proteins || 0,
      water: stat.water || 0,
      weight: stat.weight || 0
    }));
  },
});

// Helper : Formatte la date selon la plage
function formatDateForGraph(dateStr, days) {
  const date = new Date(dateStr);
  
  if (days === 7) {
    // Pour 7 jours : "Lun", "Mar"...
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return dayNames[date.getDay()];
  } else {
    // Pour 30 jours : "12/01"
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  }
}