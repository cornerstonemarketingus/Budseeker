import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessDeal } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email || !await db.newsletterSubscriber.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "Email signup is required to use Bud Seeker." }, { status: 403 });
  }

  const product = await db.product.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, price: true, comparePrice: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 90);
  const [history, deal] = await Promise.all([
    db.priceObservation.findMany({
      where: { productId: product.id, observedAt: { gte: windowStart } },
      orderBy: { observedAt: "asc" },
      select: { price: true, comparePrice: true, observedAt: true },
    }),
    assessDeal(product.id, product.price, product.comparePrice),
  ]);

  return NextResponse.json({
    product: { name: product.name, slug: product.slug, price: product.price, comparePrice: product.comparePrice },
    deal,
    history,
  });
}
