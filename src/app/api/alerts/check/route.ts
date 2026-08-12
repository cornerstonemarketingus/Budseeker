import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMember, MEMBERSHIP_REQUIRED_RESPONSE } from "@/lib/membership";

export const dynamic = "force-dynamic";

// Pull-based on purpose: there's no email/push provider wired up yet, so a client
// polls this to see which of a member's open alerts currently satisfy their condition.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!await isMember(email)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });

  const openAlerts = await db.alert.findMany({
    where: { email: email!, triggeredAt: null },
    include: { variant: { include: { listings: true, canonicalProduct: { select: { name: true } } } } },
  });

  const triggered: Array<{ id: string; type: string; product: string; variantLabel: string; price: number }> = [];
  for (const alert of openAlerts) {
    const listing = alert.variant.listings[0];
    if (!listing) continue;
    const conditionMet = alert.type === "PRICE_DROP"
      ? alert.targetPrice != null && listing.price <= alert.targetPrice
      : listing.inStock;
    if (!conditionMet) continue;

    await db.alert.update({ where: { id: alert.id }, data: { triggeredAt: new Date() } });
    triggered.push({
      id: alert.id,
      type: alert.type,
      product: alert.variant.canonicalProduct.name,
      variantLabel: alert.variant.label,
      price: listing.price,
    });
  }

  return NextResponse.json({ triggered });
}
