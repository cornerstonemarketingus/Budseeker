import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type SearchResult = {
  type: "product" | "dispensary" | "brand";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
};

/**
 * Typo-tolerant ranked search behind a stable interface — swapping this
 * Postgres pg_trgm implementation for Typesense/Meilisearch/Algolia later
 * (architecture doc, section K) is an adapter change, not a rewrite of
 * every call site.
 */
export async function search(query: string, limit = 20): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Lower the trigram match threshold for this transaction only — the
  // Postgres default (0.3) is tuned for longer strings and misses short
  // real-world typos ("Eagn" -> "Eagan"). Scoped with SET LOCAL so it
  // never leaks into other connections/queries on the pool.
  const [products, dispensaries, brands] = await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL pg_trgm.similarity_threshold = 0.2");
    return Promise.all([
      tx.$queryRaw<{ id: string; slug: string; name: string; brandSlug: string; brandName: string; score: number }[]>(Prisma.sql`
        SELECT cp.id, cp.slug, cp.name, b.slug AS "brandSlug", b.name AS "brandName",
               similarity(cp.name, ${trimmed}) AS score
        FROM canonical_products cp
        JOIN brands b ON b.id = cp."brandId"
        WHERE cp.status = 'PUBLISHED' AND cp.name % ${trimmed}
        ORDER BY score DESC
        LIMIT ${limit};
      `),
      tx.$queryRaw<{ id: string; slug: string; name: string; city: string; state: string; score: number }[]>(Prisma.sql`
        SELECT id, slug, name, city, state, similarity(name, ${trimmed}) AS score
        FROM dispensaries
        WHERE status = 'ACTIVE' AND name % ${trimmed}
        ORDER BY score DESC
        LIMIT ${limit};
      `),
      tx.$queryRaw<{ id: string; slug: string; name: string; score: number }[]>(Prisma.sql`
        SELECT id, slug, name, similarity(name, ${trimmed}) AS score
        FROM brands
        WHERE name % ${trimmed}
        ORDER BY score DESC
        LIMIT ${limit};
      `),
    ]);
  });

  const results: SearchResult[] = [
    ...products.map((p) => ({
      type: "product" as const,
      id: p.id,
      title: p.name,
      subtitle: `by ${p.brandName}`,
      href: `/products/${p.brandSlug}/${p.slug}`,
      score: p.score,
    })),
    ...dispensaries.map((d) => ({
      type: "dispensary" as const,
      id: d.id,
      title: d.name,
      subtitle: `${d.city}, ${d.state}`,
      href: `/dispensaries/${d.slug}`,
      score: d.score,
    })),
    ...brands.map((b) => ({
      type: "brand" as const,
      id: b.id,
      title: b.name,
      subtitle: "Brand",
      href: `/brands/${b.slug}`,
      score: b.score,
    })),
  ];

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
