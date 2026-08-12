import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ error: "Enter a city or ZIP code." }, { status: 400 });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&limit=1&q=${encodeURIComponent(query)}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "BudSeeker/1.0",
      },
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    const results = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
    const result = results[0];
    if (!result) return NextResponse.json({ error: "We could not find that location." }, { status: 404 });
    return NextResponse.json({ latitude: Number(result.lat), longitude: Number(result.lon), label: result.display_name });
  } catch (error) {
    console.error("Geocoding failed:", error);
    return NextResponse.json({ error: "Location search is temporarily unavailable. Try current location." }, { status: 502 });
  }
}
