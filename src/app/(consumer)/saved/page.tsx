import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/server/auth/config";
import { listSavedBrands, listSavedProducts, listSavedStores } from "@/server/favorites/repository";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user) return null; // middleware already redirects unauthenticated requests

  const [products, stores, brands] = await Promise.all([
    listSavedProducts(session.user.id),
    listSavedStores(session.user.id),
    listSavedBrands(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-3xl font-semibold">Saved</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Products {products.some((p) => p.onSale) && <Badge variant="success" className="ml-2">Some on sale</Badge>}</h2>
        {products.length === 0 ? (
          <Empty message="Save a product from any listing to track it here." />
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Link key={p.id} href={`/products/${p.brandSlug}/${p.slug}`}>
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{p.name}</h3>
                      {p.onSale && <Badge variant="success">On sale</Badge>}
                    </div>
                    <p className="text-sm text-fg-muted">{p.brandName}</p>
                    {p.lowestPrice != null && <p className="mt-2 font-mono">${p.lowestPrice.toFixed(2)}</p>}
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Stores</h2>
        {stores.length === 0 ? (
          <Empty message="Save a dispensary to see it here." />
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => (
              <Link key={s.id} href={`/dispensaries/${s.slug}`}>
                <Card>
                  <CardBody>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-sm text-fg-muted">{s.city}, {s.state}</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Brands</h2>
        {brands.length === 0 ? (
          <Empty message="Follow a brand to see it here." />
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {brands.map((b) => (
              <Link key={b.id} href={`/brands/${b.slug}`}>
                <Badge variant="neutral">{b.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-fg-muted">{message}</p>;
}
