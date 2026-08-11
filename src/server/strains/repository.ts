import "server-only";
import { db } from "@/lib/db";

export async function listStrains() {
  const strains = await db.strain.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return strains.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    type: s.type,
    description: s.description,
    productCount: s._count.products,
  }));
}

export async function getStrainBySlug(slug: string) {
  const strain = await db.strain.findUnique({
    where: { slug },
    include: { products: { where: { status: "PUBLISHED" }, include: { brand: true, category: true } } },
  });
  if (!strain) return null;
  return {
    id: strain.id,
    name: strain.name,
    slug: strain.slug,
    type: strain.type,
    description: strain.description,
    products: strain.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brandName: p.brand.name,
      brandSlug: p.brand.slug,
      categoryName: p.category.name,
    })),
  };
}
