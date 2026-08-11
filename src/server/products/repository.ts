import "server-only";
import { db } from "@/lib/db";

export type ProductListingRow = {
  listingId: string;
  dispensaryName: string;
  dispensarySlug: string;
  dispensaryCity: string;
  dispensaryState: string;
  price: number;
  salePrice: number | null;
  inStock: boolean;
  packageSize: number;
  unit: string;
  pricePerUnit: number;
};

export async function listPublishedProducts(params: { categorySlug?: string; maxPrice?: number; take?: number } = {}) {
  const products = await db.canonicalProduct.findMany({
    where: {
      status: "PUBLISHED",
      category: params.categorySlug ? { slug: params.categorySlug } : undefined,
    },
    take: params.take ?? 40,
    orderBy: { createdAt: "desc" },
    include: {
      brand: true,
      category: true,
      strain: true,
      variants: { include: { listings: { where: { inStock: true } } } },
    },
  });

  return products
    .map((product) => toProductSummary(product))
    .filter((p) => (params.maxPrice ? p.lowestPrice != null && p.lowestPrice <= params.maxPrice : true));
}

export async function getProductBySlug(brandSlug: string, productSlug: string) {
  const product = await db.canonicalProduct.findFirst({
    where: { slug: productSlug, brand: { slug: brandSlug } },
    include: {
      brand: true,
      category: true,
      strain: true,
      variants: {
        include: {
          listings: {
            include: { dispensary: { select: { name: true, slug: true, city: true, state: true } } },
          },
        },
      },
    },
  });
  if (!product) return null;

  const listingRows: ProductListingRow[] = product.variants.flatMap((variant) =>
    variant.listings.map((listing) => ({
      listingId: listing.id,
      dispensaryName: listing.dispensary.name,
      dispensarySlug: listing.dispensary.slug,
      dispensaryCity: listing.dispensary.city,
      dispensaryState: listing.dispensary.state,
      price: Number(listing.price),
      salePrice: listing.salePrice != null ? Number(listing.salePrice) : null,
      inStock: listing.inStock,
      packageSize: Number(variant.packageSize),
      unit: variant.unit,
      pricePerUnit: Number((listing.salePrice ?? listing.price)) / Number(variant.packageSize),
    })),
  );
  listingRows.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));

  return {
    ...toProductSummary(product),
    description: product.description,
    effects: product.effects,
    flavors: product.flavors,
    listings: listingRows,
  };
}

function toProductSummary(product: {
  id: string;
  name: string;
  slug: string;
  images: string[];
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  strain: { name: string; slug: string; type: string } | null;
  variants: {
    packageSize: unknown;
    unit: string;
    thcPercent: unknown;
    cbdPercent: unknown;
    listings: { price: unknown; salePrice: unknown }[];
  }[];
}) {
  const allListings = product.variants.flatMap((v) => v.listings);
  const effectivePrices = allListings.map((l) => Number(l.salePrice ?? l.price));
  const lowestPrice = effectivePrices.length ? Math.min(...effectivePrices) : null;
  const firstVariant = product.variants[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    images: product.images,
    brandName: product.brand.name,
    brandSlug: product.brand.slug,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    strainName: product.strain?.name ?? null,
    strainSlug: product.strain?.slug ?? null,
    strainType: product.strain?.type ?? null,
    thcPercent: firstVariant?.thcPercent != null ? Number(firstVariant.thcPercent) : null,
    cbdPercent: firstVariant?.cbdPercent != null ? Number(firstVariant.cbdPercent) : null,
    lowestPrice,
    listingCount: allListings.length,
  };
}
