import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMember, MEMBERSHIP_REQUIRED_RESPONSE } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!await isMember(email)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });

  const lists = await db.shoppingList.findMany({
    where: { email: email! },
    include: {
      items: { include: { variant: { include: { canonicalProduct: true, listings: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
  const { email, name } = await req.json() as { email?: string; name?: string };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!await isMember(normalizedEmail)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });

  const list = await db.shoppingList.create({
    data: { email: normalizedEmail!, name: name?.trim() || "My list" },
  });
  return NextResponse.json({ list });
}
