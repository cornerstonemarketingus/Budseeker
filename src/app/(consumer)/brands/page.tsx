import Link from "next/link";
import type { Metadata } from "next";
import { listBrands } from "@/server/brands/repository";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const brands = await listBrands();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-semibold">Brands</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <Link key={b.id} href={`/brands/${b.slug}`}>
            <Card className="h-full">
              <CardBody>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{b.name}</h2>
                  {b.verified && <Badge variant="success">Verified</Badge>}
                </div>
                {b.description && <p className="mt-1 text-sm text-fg-muted">{b.description}</p>}
                <p className="mt-3 text-xs text-fg-muted">{b.productCount} product{b.productCount === 1 ? "" : "s"}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
