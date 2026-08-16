import { NextRequest, NextResponse } from "next/server";
import { getMinnesotaDispensaries } from "@/lib/minnesota-retailers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Valid coordinates are required." }, { status: 400 });
  }

  try {
    const places = await getMinnesotaDispensaries(lat, lon);
    return NextResponse.json({ places, source: "Minnesota OCM licensed retailer directory" });
  } catch (error) {
    console.error("Dispensary lookup failed:", error);
    return NextResponse.json({
      places: [],
      source: "Licensed retailer directory temporarily limited",
      limited: true,
    });
  }
}
