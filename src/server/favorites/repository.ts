import "server-only";
import { db } from "@/lib/db";

export async function listSavedProducts(userId: string) {
  const saved = await db.savedProduct.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          brand: true,
          category: true,
          variants: { include: { listings: { where: { inStock: true } } } },
        },
      },
    },
  });

  return saved.map(({ product }) => {
    const listings = product.variants.flatMap((v) => v.listings);
    const onSale = listings.some((l) => l.salePrice != null);
    const lowest = listings.length
      ? Math.min(...listings.map((l) => Number(l.salePrice ?? l.price)))
      : null;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brandName: product.brand.name,
      brandSlug: product.brand.slug,
      categoryName: product.category.name,
      lowestPrice: lowest,
      onSale,
    };
  });
}

export async function listSavedStores(userId: string) {
  const saved = await db.savedStore.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { dispensary: true },
  });
  return saved.map(({ dispensary }) => ({
    id: dispensary.id,
    name: dispensary.name,
    slug: dispensary.slug,
    city: dispensary.city,
    state: dispensary.state,
    ratingAverage: Number(dispensary.ratingAverage),
  }));
}

export async function listSavedBrands(userId: string) {
  const saved = await db.savedBrand.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { brand: true },
  });
  return saved.map(({ brand }) => ({ id: brand.id, name: brand.name, slug: brand.slug, verified: brand.verified }));
}
