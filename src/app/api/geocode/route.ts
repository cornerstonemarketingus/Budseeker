import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geocodeLocation } from "@/server/geo/osm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!query) return NextResponse.json({ error: "Enter a city or ZIP code." }, { status: 400 });
  if (!email || !(await db.newsletterSubscriber.findUnique({ where: { email }, select: { id: true } }))) {
    return NextResponse.json({ error: "Email signup is required to use Bud Seeker." }, { status: 403 });
  }

  try {
    const result = await geocodeLocation(query);
    if (!result) return NextResponse.json({ error: "We could not find that location." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Geocoding failed:", error);
    return NextResponse.json({ error: "Location search is temporarily unavailable. Try current location." }, { status: 502 });
  }
}
