import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 3958.8;
  const toRadians = (value: number) => value * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Valid coordinates are required." }, { status: 400 });
  }
  if (!email || !await db.newsletterSubscriber.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "Email signup is required to use Bud Seeker." }, { status: 403 });
  }

  const query = `[out:json][timeout:20];
    (
      node["shop"="cannabis"](around:50000,${lat},${lon});
      way["shop"="cannabis"](around:50000,${lat},${lon});
      relation["shop"="cannabis"](around:50000,${lat},${lon});
    );
    out center tags;`;

  try {
    const endpoints = [
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass-api.de/api/interpreter",
      "https://overpass.nchc.org.tw/api/interpreter",
    ];
    let response: Response | null = null;
    for (const endpoint of endpoints) {
      const attempt = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "BudSeeker/1.0",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(25000),
        next: { revalidate: 1800 },
      }).catch(() => null);
      if (attempt?.ok) {
        response = attempt;
        break;
      }
      console.warn("Overpass endpoint rejected lookup:", endpoint, attempt?.status);
    }
    if (!response) throw new Error("All Overpass endpoints rejected the request");
    const data = await response.json() as { elements?: OverpassElement[] };
    const places = (data.elements ?? []).flatMap((element) => {
      const placeLat = element.lat ?? element.center?.lat;
      const placeLon = element.lon ?? element.center?.lon;
      if (placeLat == null || placeLon == null) return [];
      const tags = element.tags ?? {};
      const address = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:city"],
        tags["addr:state"],
      ].filter(Boolean).join(" ");
      const deliveryTag = (tags.delivery || tags["service:delivery"] || "").toLowerCase();
      return [{
        id: String(element.id),
        name: tags.name || tags.brand || "Cannabis dispensary",
        address: address || "Address available in directions",
        distanceMiles: Number(distanceMiles(lat, lon, placeLat, placeLon).toFixed(1)),
        openingHours: tags.opening_hours || null,
        website: tags.website || tags["contact:website"] || null,
        phone: tags.phone || tags["contact:phone"] || null,
        latitude: placeLat,
        longitude: placeLon,
        delivery: deliveryTag === "yes" || deliveryTag === "only",
        pickup: deliveryTag !== "only",
      }];
    }).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 20);
    return NextResponse.json({ places, source: "OpenStreetMap contributors" });
  } catch (error) {
    console.error("Dispensary lookup failed:", error);
    return NextResponse.json({
      places: [],
      source: "Search service temporarily limited",
      limited: true,
    });
  }
}
