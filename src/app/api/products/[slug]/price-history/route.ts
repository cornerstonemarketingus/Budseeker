import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessDeal } from "@/lib/pricing";
import { isMember, MEMBERSHIP_REQUIRED_RESPONSE } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!await isMember(email)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });

  const product = await db.canonicalProduct.findUnique({
    where: { slug },
    include: {
      variants: {
        include: { listings: { where: { published: true } } },
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 90);

  const variants = await Promise.all(
    product.variants.flatMap((variant) =>
      variant.listings.map(async (listing) => {
        const [history, deal] = await Promise.all([
          db.priceObservation.findMany({
            where: { listingId: listing.id, observedAt: { gte: windowStart } },
            orderBy: { observedAt: "asc" },
            select: { price: true, comparePrice: true, observedAt: true },
          }),
          assessDeal(listing.id, listing.price, listing.comparePrice),
        ]);
        return {
          variantId: variant.id,
          label: variant.label,
          price: listing.price,
          comparePrice: listing.comparePrice,
          inStock: listing.inStock,
          deal,
          history,
        };
      }),
    ),
  );

  return NextResponse.json({
    product: { name: product.name, slug: product.slug },
    variants,
  });
}
