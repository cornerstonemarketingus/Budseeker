import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMember, MEMBERSHIP_REQUIRED_RESPONSE } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!await isMember(email)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });

  const favorites = await db.favorite.findMany({
    where: { email: email! },
    include: { canonicalProduct: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const { email, slug } = await req.json() as { email?: string; slug?: string };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!await isMember(normalizedEmail)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });
  if (!slug) return NextResponse.json({ error: "Product slug required." }, { status: 400 });

  const product = await db.canonicalProduct.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const favorite = await db.favorite.upsert({
    where: { email_canonicalProductId: { email: normalizedEmail!, canonicalProductId: product.id } },
    create: { email: normalizedEmail!, canonicalProductId: product.id },
    update: {},
  });
  await db.userEvent.create({
    data: { email: normalizedEmail!, canonicalProductId: product.id, type: "FAVORITE" },
  }).catch(() => undefined);

  return NextResponse.json({ favorite });
}

export async function DELETE(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  const slug = req.nextUrl.searchParams.get("slug");
  if (!await isMember(email)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });
  if (!slug) return NextResponse.json({ error: "Product slug required." }, { status: 400 });

  const product = await db.canonicalProduct.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  await db.favorite.deleteMany({ where: { email: email!, canonicalProductId: product.id } });
  return NextResponse.json({ ok: true });
}
