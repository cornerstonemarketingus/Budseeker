import "server-only";
import { db } from "@/lib/db";

export async function listBrands() {
  const brands = await db.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    verified: b.verified,
    productCount: b._count.products,
  }));
}

export async function getBrandBySlug(slug: string) {
  const brand = await db.brand.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: "PUBLISHED" },
        include: { category: true, strain: true },
      },
    },
  });
  if (!brand) return null;
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    description: brand.description,
    website: brand.website,
    verified: brand.verified,
    products: brand.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      categoryName: p.category.name,
      strainName: p.strain?.name ?? null,
    })),
  };
}
