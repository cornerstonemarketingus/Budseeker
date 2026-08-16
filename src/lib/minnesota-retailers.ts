export type DispensaryPlace = {
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

type RegistryPlace = Omit<DispensaryPlace, "distanceMiles">;

type ArcGisFeature = {
  attributes: Record<string, string | number | null>;
  geometry?: { x?: number; y?: number };
};

const OCM_ITEM_URL = "https://www.arcgis.com/sharing/rest/content/items/0e33c3c3768c4319aac5942d32bd12d7";

// Official RISE locations keep the directory complete if a public map or government feed lags.
const RISE_LOCATION_DATA: Array<[string, string, number, number, string]> = [
  ["baxter", "Baxter", 46.3553156, -94.2253555, "14091 Baxter Drive, Suite 108, Baxter, MN 56425"],
  ["brooklyn-park", "Brooklyn Park", 45.0950108, -93.3787391, "8016 Brooklyn Blvd., Brooklyn Park, MN 55445"],
  ["eagan", "Eagan", 44.8307724, -93.1640005, "1340 Town Centre Dr, Eagan, MN 55123"],
  ["mankato", "Mankato", 44.1691288, -93.9516133, "201 Sioux Rd, Suite 100, Mankato, MN 56001"],
  ["new-hope", "New Hope", 45.0332413, -93.3783535, "7700 42nd Ave N, Suite A, New Hope, MN 55427"],
  ["st-cloud", "St. Cloud", 45.558188, -94.2050105, "3800 3rd St. N, St. Cloud, MN 56303"],
  ["st-paul", "St. Paul", 44.9179815, -93.1946881, "2239 Ford Pkwy, St. Paul, MN 55116"],
  ["willmar", "Willmar", 45.1080893, -95.0422257, "1413 1st St. S., Willmar, MN 56201"],
];

const RISE_LOCATIONS: RegistryPlace[] = RISE_LOCATION_DATA.map(([slug, city, latitude, longitude, address]) => ({
  id: `rise-${slug}`,
  name: `RISE Dispensary ${city}`,
  address,
  latitude,
  longitude,
  openingHours: null,
  website: "https://risecannabis.com/dispensaries/minnesota/",
  phone: null,
  delivery: false,
  pickup: true,
}));

export function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const a = Math.sin(radians(lat2 - lat1) / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(radians(lon2 - lon1) / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sameLocation(left: RegistryPlace, right: RegistryPlace) {
  return distanceMiles(left.latitude, left.longitude, right.latitude, right.longitude) < 0.35
    && (normalize(left.name) === normalize(right.name)
      || normalize(left.address) === normalize(right.address)
      || /\brise\b/.test(normalize(left.name)) && /\brise\b/.test(normalize(right.name)));
}

function withDistance(place: RegistryPlace, latitude: number, longitude: number): DispensaryPlace {
  return { ...place, distanceMiles: Number(distanceMiles(latitude, longitude, place.latitude, place.longitude).toFixed(1)) };
}

export async function fetchMinnesotaOcmRetailers(fetcher: typeof fetch = fetch): Promise<RegistryPlace[]> {
  const metadataResponse = await fetcher(`${OCM_ITEM_URL}?f=json`, { next: { revalidate: 900 }, signal: AbortSignal.timeout(12_000) });
  if (!metadataResponse.ok) throw new Error(`OCM metadata returned ${metadataResponse.status}`);
  const metadata = await metadataResponse.json() as { url?: string };
  if (!metadata.url) throw new Error("OCM dataset URL was unavailable");

  const params = new URLSearchParams({
    where: "Retail_Site_Address <> 'N/A' AND Business_Type LIKE '%Retail%'",
    outFields: "License_Number,License_Type,Legal_Business_Name,D_B_A___Doing_Business_As_,Business_Type,Retail_Site_Address,City,FID",
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "2000",
    f: "json",
  });
  const response = await fetcher(`${metadata.url.replace(/\/$/, "")}/0/query?${params}`, { next: { revalidate: 900 }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`OCM registry returned ${response.status}`);
  const data = await response.json() as { features?: ArcGisFeature[]; error?: { message?: string } };
  if (!Array.isArray(data.features)) throw new Error(data.error?.message ?? "OCM registry response was invalid");

  return data.features.flatMap((feature, index) => {
    const latitude = Number(feature.geometry?.y);
    const longitude = Number(feature.geometry?.x);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const attributes = feature.attributes;
    const dba = String(attributes.D_B_A___Doing_Business_As_ ?? "").trim();
    const legalName = String(attributes.Legal_Business_Name ?? "Licensed cannabis retailer").trim();
    const city = String(attributes.City ?? "").trim();
    const name = dba && !/^(n\/?a|na)$/i.test(dba) ? dba : legalName;
    const rise = /^rise$/i.test(name) ? RISE_LOCATIONS.find((place) => distanceMiles(place.latitude, place.longitude, latitude, longitude) < 0.5) : undefined;
    return [{
      id: `ocm-${String(attributes.FID ?? index)}`,
      name: rise?.name ?? (/^rise$/i.test(name) && city ? `RISE Dispensary ${city}` : name),
      address: rise?.address ?? String(attributes.Retail_Site_Address ?? "Address available in directions").replace(/\s*\n\s*/g, ", "),
      latitude,
      longitude,
      openingHours: null,
      website: rise?.website ?? null,
      phone: null,
      delivery: false,
      pickup: true,
    }];
  });
}

export async function getMinnesotaDispensaries(latitude: number, longitude: number, fetcher: typeof fetch = fetch) {
  let licensed: RegistryPlace[] = [];
  try {
    licensed = await fetchMinnesotaOcmRetailers(fetcher);
  } catch (error) {
    console.error("Minnesota OCM directory lookup failed:", error);
  }

  const complete = [...licensed];
  for (const rise of RISE_LOCATIONS) {
    if (!complete.some((place) => sameLocation(place, rise))) complete.push(rise);
  }

  return complete.map((place) => withDistance(place, latitude, longitude)).sort((a, b) => a.distanceMiles - b.distanceMiles);
}
