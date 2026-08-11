import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getBrandBySlug } from "@/server/brands/repository";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  return { title: brand?.name ?? "Brand" };
}

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-semibold">{brand.name}</h1>
        {brand.verified && <Badge variant="success">Verified</Badge>}
      </div>
      {brand.description && <p className="mt-2 max-w-xl text-fg-muted">{brand.description}</p>}
      {brand.website && (
        <a href={brand.website} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-accent hover:underline">
          {brand.website}
        </a>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Products</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brand.products.map((p) => (
            <Link key={p.id} href={`/products/${brand.slug}/${p.slug}`}>
              <Card className="h-full">
                <CardBody>
                  <Badge variant="neutral">{p.categoryName}</Badge>
                  <h3 className="mt-2 font-semibold">{p.name}</h3>
                  {p.strainName && <p className="text-sm text-fg-muted">{p.strainName}</p>}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
