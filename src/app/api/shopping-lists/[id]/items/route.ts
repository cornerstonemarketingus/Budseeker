import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMember, MEMBERSHIP_REQUIRED_RESPONSE } from "@/lib/membership";

export const dynamic = "force-dynamic";

async function loadOwnedList(id: string, email: string) {
  const list = await db.shoppingList.findUnique({ where: { id }, select: { email: true } });
  return list && list.email === email ? list : null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { email, variantId, quantity } = await req.json() as { email?: string; variantId?: string; quantity?: number };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!await isMember(normalizedEmail)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });
  if (!variantId) return NextResponse.json({ error: "variantId required." }, { status: 400 });
  if (!await loadOwnedList(id, normalizedEmail!)) return NextResponse.json({ error: "List not found." }, { status: 404 });

  const safeQuantity = quantity && quantity > 0 ? Math.floor(quantity) : 1;
  const item = await db.shoppingListItem.upsert({
    where: { shoppingListId_variantId: { shoppingListId: id, variantId } },
    create: { shoppingListId: id, variantId, quantity: safeQuantity },
    update: { quantity: safeQuantity },
  });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  const variantId = req.nextUrl.searchParams.get("variantId");
  if (!await isMember(email)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });
  if (!variantId) return NextResponse.json({ error: "variantId required." }, { status: 400 });
  if (!await loadOwnedList(id, email!)) return NextResponse.json({ error: "List not found." }, { status: 404 });

  await db.shoppingListItem.deleteMany({ where: { shoppingListId: id, variantId } });
  return NextResponse.json({ ok: true });
}
