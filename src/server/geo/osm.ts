import "server-only";

/**
 * Community-map layer: OpenStreetMap-tagged `shop=cannabis` points.
 * This is explicitly NOT the licensed-dispensary system of record — those
 * live in the `Dispensary`/`MerchantLicense` tables and are only ever
 * marked verified by an admin action. OSM data is crowd-sourced and
 * unverified, so every surface using it is labeled accordingly.
 */

export type OsmPlace = {
  id: string;
  name: string;
  address: string;
  distanceMiles: number;
  openingHours: string | null;
  website: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  delivery: boolean;
  pickup: boolean;
};

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 3958.8;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];

export async function findNearbyOsmPlaces(lat: number, lon: number): Promise<{ places: OsmPlace[]; limited: boolean }> {
  const query = `[out:json][timeout:20];
    (
      node["shop"="cannabis"](around:50000,${lat},${lon});
      way["shop"="cannabis"](around:50000,${lat},${lon});
      relation["shop"="cannabis"](around:50000,${lat},${lon});
    );
    out center tags;`;

  let response: Response | null = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const attempt = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
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
  }
  if (!response) return { places: [], limited: true };

  const data = (await response.json()) as { elements?: OverpassElement[] };
  const places = (data.elements ?? [])
    .flatMap((element) => {
      const placeLat = element.lat ?? element.center?.lat;
      const placeLon = element.lon ?? element.center?.lon;
      if (placeLat == null || placeLon == null) return [];
      const tags = element.tags ?? {};
      const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:state"]]
        .filter(Boolean)
        .join(" ");
      const deliveryTag = (tags.delivery || tags["service:delivery"] || "").toLowerCase();
      return [
        {
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
        },
      ];
    })
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, 20);

  return { places, limited: false };
}

export async function geocodeLocation(query: string): Promise<{ latitude: number; longitude: number; label: string } | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&limit=1&q=${encodeURIComponent(query)}`,
    {
      headers: { Accept: "application/json", "User-Agent": "BudSeeker/1.0" },
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 86400 },
    },
  );
  if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
  const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  const result = results[0];
  if (!result) return null;
  return { latitude: Number(result.lat), longitude: Number(result.lon), label: result.display_name };
}
