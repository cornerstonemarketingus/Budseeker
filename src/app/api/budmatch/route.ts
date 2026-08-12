import { NextRequest, NextResponse } from "next/server";
import { isMember, MEMBERSHIP_REQUIRED_RESPONSE } from "@/lib/membership";
import { computeBudMatches } from "@/lib/budmatch";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!await isMember(email)) return NextResponse.json(MEMBERSHIP_REQUIRED_RESPONSE, { status: 403 });

  const matches = await computeBudMatches(email!);
  return NextResponse.json({ matches });
}
