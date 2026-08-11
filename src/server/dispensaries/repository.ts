import "server-only";
import { db } from "@/lib/db";

export async function listActiveDispensaries() {
  const rows = await db.dispensary.findMany({
    where: { status: "ACTIVE" },
    include: { license: true, _count: { select: { listings: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map(toDispensarySummary);
}

export async function getDispensaryBySlug(slug: string) {
  const row = await db.dispensary.findUnique({
    where: { slug },
    include: {
      license: true,
      hours: { orderBy: { dayOfWeek: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!row) return null;
  return {
    ...toDispensarySummary(row),
    hours: row.hours,
    photos: row.photos,
    description: row.description,
    address1: row.address1,
    website: row.website,
    phone: row.phone,
  };
}

export async function getDispensaryListings(dispensaryId: string) {
  const listings = await db.dispensaryListing.findMany({
    where: { dispensaryId },
    orderBy: { updatedAt: "desc" },
    take: 40,
    include: {
      productVariant: { include: { canonicalProduct: { include: { brand: true, category: true } } } },
    },
  });
  return listings.map((listing) => ({
    id: listing.id,
    productName: listing.productVariant.canonicalProduct.name,
    productSlug: listing.productVariant.canonicalProduct.slug,
    brandSlug: listing.productVariant.canonicalProduct.brand.slug,
    brandName: listing.productVariant.canonicalProduct.brand.name,
    categoryName: listing.productVariant.canonicalProduct.category.name,
    packageSize: Number(listing.productVariant.packageSize),
    unit: listing.productVariant.unit,
    price: Number(listing.price),
    salePrice: listing.salePrice != null ? Number(listing.salePrice) : null,
    inStock: listing.inStock,
  }));
}

function toDispensarySummary(row: {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  ratingAverage: unknown;
  ratingCount: number;
  lastMenuSyncAt: Date | null;
  license: { status: string } | null;
  _count?: { listings: number };
}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    state: row.state,
    latitude: row.latitude,
    longitude: row.longitude,
    ratingAverage: Number(row.ratingAverage),
    ratingCount: row.ratingCount,
    lastMenuSyncAt: row.lastMenuSyncAt,
    licenseStatus: row.license?.status ?? "UNVERIFIED",
    listingCount: row._count?.listings ?? 0,
  };
}
