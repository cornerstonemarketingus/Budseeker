import Link from "next/link";
import type { Metadata } from "next";
import { listPublishedProducts } from "@/server/products/repository";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ maxPrice?: string }> }) {
  const { maxPrice } = await searchParams;
  const products = await listPublishedProducts({ maxPrice: maxPrice ? Number(maxPrice) : undefined, take: 60 });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-semibold">Products</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Canonical products, compared across every dispensary that lists them — {products.length} shown.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.brandSlug}/${p.slug}`}>
            <Card className="h-full">
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="neutral">{p.categoryName}</Badge>
                  {p.strainType && <Badge variant="accent">{p.strainType}</Badge>}
                </div>
                <h2 className="mt-3 font-semibold">{p.name}</h2>
                <p className="text-sm text-fg-muted">{p.brandName}</p>
                {(p.thcPercent != null || p.cbdPercent != null) && (
                  <p className="mt-2 font-mono text-xs text-fg-muted">
                    {p.thcPercent != null && `THC ${p.thcPercent}%`}
                    {p.thcPercent != null && p.cbdPercent != null && " · "}
                    {p.cbdPercent != null && `CBD ${p.cbdPercent}%`}
                  </p>
                )}
                <p className="mt-3 font-mono text-lg font-semibold">
                  {p.lowestPrice != null ? `From $${p.lowestPrice.toFixed(2)}` : "Currently unavailable"}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
