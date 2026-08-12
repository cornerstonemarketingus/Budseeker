import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMember, MEMBERSHIP_REQUIRED_RESPONSE } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.canonicalProduct.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const reviews = await db.review.findMany({
    where: { canonicalProductId: product.id },
    orderBy: { createdAt: "desc" },
    select: { rating: true, comment: true, createdAt: true },
  });
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return NextResponse.json({
    reviews,
    averageRating: averageRating != null ? Number(averageRating.toFixed(2)) : null,
    count: reviews.length,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { email, rating, comment } = await req.json() as { email?: string; rating?: number; comment?: string };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!await isMember(normalizedEmail)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });
  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be an integer from 1 to 5." }, { status: 400 });
  }

  const product = await db.canonicalProduct.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const review = await db.review.upsert({
    where: { canonicalProductId_email: { canonicalProductId: product.id, email: normalizedEmail! } },
    create: { canonicalProductId: product.id, email: normalizedEmail!, rating, comment: comment?.trim() || null },
    update: { rating, comment: comment?.trim() || null },
  });
  return NextResponse.json({ review });
}
