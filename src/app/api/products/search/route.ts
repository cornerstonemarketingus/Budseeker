import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessDeal, recordPriceObservation } from "@/lib/pricing";

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

  const results = (
    await Promise.all(
      products.flatMap((product) =>
        product.variants.flatMap((variant) =>
          variant.listings.map(async (listing) => {
            const [, deal] = await Promise.all([
              recordPriceObservation(listing.id, listing.price, listing.comparePrice).catch(() => undefined),
              assessDeal(listing.id, listing.price, listing.comparePrice),
            ]);
            return {
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
              deal,
            };
          }),
        ),
      ),
    )
  ).sort((a, b) => (b.deal?.dealScore ?? 0) - (a.deal?.dealScore ?? 0));

  return NextResponse.json({ results });
}
