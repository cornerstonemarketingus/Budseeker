import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMember, MEMBERSHIP_REQUIRED_RESPONSE } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!await isMember(email)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });

  const alerts = await db.alert.findMany({
    where: { email: email! },
    include: { variant: { include: { canonicalProduct: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const { email, variantId, type, targetPrice } = await req.json() as {
    email?: string;
    variantId?: string;
    type?: "PRICE_DROP" | "BACK_IN_STOCK";
    targetPrice?: number;
  };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!await isMember(normalizedEmail)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });
  if (!variantId || (type !== "PRICE_DROP" && type !== "BACK_IN_STOCK")) {
    return NextResponse.json({ error: "variantId and a valid type (PRICE_DROP or BACK_IN_STOCK) are required." }, { status: 400 });
  }
  if (type === "PRICE_DROP" && !(targetPrice && targetPrice > 0)) {
    return NextResponse.json({ error: "targetPrice is required for price-drop alerts." }, { status: 400 });
  }

  const variant = await db.productVariant.findUnique({ where: { id: variantId }, select: { id: true } });
  if (!variant) return NextResponse.json({ error: "Product variant not found." }, { status: 404 });

  const alert = await db.alert.create({
    data: {
      email: normalizedEmail!,
      variantId,
      type,
      targetPrice: type === "PRICE_DROP" ? targetPrice : null,
    },
  });
  return NextResponse.json({ alert });
}
