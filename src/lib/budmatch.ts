import { db } from "@/lib/db";

export type BudMatchResult = { productId: string; name: string; slug: string; matchScore: number };

function jaccard(a: string[], b: string[]) {
  const setA = new Set(a.map((value) => value.toLowerCase()));
  const setB = new Set(b.map((value) => value.toLowerCase()));
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter((value) => setB.has(value)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * A rules-based taste-profile heuristic, not a trained model: it builds a profile from a
 * user's favorited products' attributes and scores everything else against it. Real, cheap,
 * and honest about what it is — a starting point to replace once there's enough behavioral
 * data (views, purchases, dislikes) to train something more sophisticated.
 */
export async function computeBudMatches(email: string, limit = 10): Promise<BudMatchResult[]> {
  const favorites = await db.favorite.findMany({
    where: { email },
    include: { canonicalProduct: true },
  });
  if (favorites.length === 0) return [];

  const favoriteIds = favorites.map((favorite) => favorite.canonicalProductId);
  const profileEffects = favorites.flatMap((favorite) => favorite.canonicalProduct.effects);
  const profileFlavors = favorites.flatMap((favorite) => favorite.canonicalProduct.flavors);
  const profileTerpenes = favorites.flatMap((favorite) => favorite.canonicalProduct.terpenes);
  const thcValues = favorites
    .map((favorite) => favorite.canonicalProduct.thcContent)
    .filter((value): value is number => value != null);
  const avgThc = thcValues.length > 0 ? thcValues.reduce((sum, value) => sum + value, 0) / thcValues.length : null;

  const candidates = await db.canonicalProduct.findMany({
    where: { id: { notIn: favoriteIds } },
    take: 200,
  });

  const scored = candidates.map((candidate) => {
    const effectScore = jaccard(profileEffects, candidate.effects);
    const flavorScore = jaccard(profileFlavors, candidate.flavors);
    const terpeneScore = jaccard(profileTerpenes, candidate.terpenes);
    const thcScore =
      avgThc != null && candidate.thcContent != null
        ? Math.max(0, 1 - Math.abs(avgThc - candidate.thcContent) / 30)
        : 0;
    const matchScore = Math.round((effectScore * 0.4 + flavorScore * 0.2 + terpeneScore * 0.2 + thcScore * 0.2) * 100);
    return { productId: candidate.id, name: candidate.name, slug: candidate.slug, matchScore };
  });

  return scored
    .filter((result) => result.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
