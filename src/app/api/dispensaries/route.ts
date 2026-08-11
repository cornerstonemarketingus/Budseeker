import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findNearbyOsmPlaces } from "@/server/geo/osm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Valid coordinates are required." }, { status: 400 });
  }
  if (!email || !(await db.newsletterSubscriber.findUnique({ where: { email }, select: { id: true } }))) {
    return NextResponse.json({ error: "Email signup is required to use Bud Seeker." }, { status: 403 });
  }

  try {
    const { places, limited } = await findNearbyOsmPlaces(lat, lon);
    return NextResponse.json({ places, source: "OpenStreetMap contributors", limited: limited || undefined });
  } catch (error) {
    console.error("Dispensary lookup failed:", error);
    return NextResponse.json({ places: [], source: "Search service temporarily limited", limited: true });
  }
}
