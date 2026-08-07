import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.newsletterSubscriber.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ message: "Already subscribed", alreadySubscribed: true });
    }

    await db.newsletterSubscriber.create({ data: { email: normalizedEmail } });

    return NextResponse.json({ message: "Subscribed!", alreadySubscribed: false });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
