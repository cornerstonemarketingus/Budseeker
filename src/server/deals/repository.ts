import "server-only";
import { db } from "@/lib/db";

/**
 * A deal is never assumed to apply — status/startsAt/endsAt are always
 * checked here rather than trusting a merchant-set flag alone.
 */
export async function listActiveDeals() {
  const now = new Date();
  const deals = await db.deal.findMany({
    where: { status: "ACTIVE", startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { endsAt: "asc" },
    include: {
      locations: { include: { dispensary: { select: { name: true, slug: true, city: true, state: true } } } },
      brands: { include: { brand: { select: { name: true, slug: true } } } },
    },
  });
  return deals.map((deal) => ({
    id: deal.id,
    title: deal.title,
    description: deal.description,
    dealType: deal.dealType,
    percentOff: deal.percentOff != null ? Number(deal.percentOff) : null,
    fixedPrice: deal.fixedPrice != null ? Number(deal.fixedPrice) : null,
    startsAt: deal.startsAt,
    endsAt: deal.endsAt,
    terms: deal.terms,
    dispensaries: deal.locations.map((l) => l.dispensary),
    brands: deal.brands.map((b) => b.brand),
  }));
}
