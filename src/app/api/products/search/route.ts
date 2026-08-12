import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/lib/db";
import { computeDealAssessment, getPriceHistoryMap, recordPriceObservationsBatch } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const categorySlug = req.nextUrl.searchParams.get("category") ?? undefined;

  const products = await db.canonicalProduct.findMany({
    where: {
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { strain: { contains: q, mode: "insensitive" } },
              { brand: { name: { contains: q, mode: "insensitive" } } },
              { effects: { has: q.toLowerCase() } },
              { flavors: { has: q.toLowerCase() } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      brand: true,
      variants: { include: { listings: { where: { published: true, inStock: true } } } },
    },
    take: 40,
  });

  const listings = products.flatMap((product) =>
    product.variants.flatMap((variant) => variant.listings.map((listing) => ({ product, variant, listing }))),
  );
  const listingIds = listings.map((entry) => entry.listing.id);

  // Today's snapshot is bookkeeping for future DealScores, not needed for this response —
  // deferred to run after the response is sent instead of adding a per-listing round trip here.
  after(() =>
    recordPriceObservationsBatch(
      listings.map((entry) => ({ listingId: entry.listing.id, price: entry.listing.price, comparePrice: entry.listing.comparePrice })),
    ).catch((err) => console.error("Price observation batch failed:", err)),
  );
  const historyMap = await getPriceHistoryMap(listingIds);

  const results = listings
    .map(({ product, variant, listing }) => ({
      productName: product.name,
      slug: product.slug,
      brand: product.brand?.name ?? null,
      category: product.category.name,
      strain: product.strain,
      thcContent: product.thcContent,
      cbdContent: product.cbdContent,
      effects: product.effects,
      variantId: variant.id,
      variantLabel: variant.label,
      price: listing.price,
      comparePrice: listing.comparePrice,
      deal: computeDealAssessment(historyMap.get(listing.id) ?? [], listing.price, listing.comparePrice),
    }))
    .sort((a, b) => (b.deal?.dealScore ?? 0) - (a.deal?.dealScore ?? 0));

  return NextResponse.json({ results });
}
