import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductBySlug } from "@/server/products/repository";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; slug: string }>;
}): Promise<Metadata> {
  const { brand, slug } = await params;
  const product = await getProductBySlug(brand, slug);
  return { title: product ? `${product.name} — ${product.brandName}` : "Product" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ brand: string; slug: string }> }) {
  const { brand, slug } = await params;
  const product = await getProductBySlug(brand, slug);
  if (!product) notFound();

  const cheapest = product.listings[0];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Link href={`/brands/${product.brandSlug}`} className="hover:text-accent">
          {product.brandName}
        </Link>
        <span>/</span>
        <span>{product.categoryName}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{product.categoryName}</Badge>
            {product.strainName && product.strainSlug && (
              <Link href={`/strains/${product.strainSlug}`}>
                <Badge variant="accent">{product.strainName}</Badge>
              </Link>
            )}
            {product.thcPercent != null && <Badge variant="neutral">THC {product.thcPercent}%</Badge>}
            {product.cbdPercent != null && <Badge variant="neutral">CBD {product.cbdPercent}%</Badge>}
          </div>
        </div>
        {cheapest && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-fg-muted">Lowest nearby</p>
            <p className="font-mono text-2xl font-semibold text-success">
              ${(cheapest.salePrice ?? cheapest.price).toFixed(2)}
            </p>
            <p className="text-xs text-fg-muted">
              ${cheapest.pricePerUnit.toFixed(2)}/{cheapest.unit}
            </p>
          </div>
        )}
      </div>

      {product.description && <p className="mt-6 max-w-2xl text-fg-muted">{product.description}</p>}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Available near you</h2>
        <p className="text-sm text-fg-muted">
          Prices normalized to cost per {product.listings[0]?.unit ?? "unit"} so listings are directly comparable across
          package sizes.
        </p>
        {product.listings.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-fg-muted">
            No dispensary currently lists this product.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-fg-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Dispensary</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Per {product.listings[0].unit}</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {product.listings.map((listing) => (
                  <tr key={listing.listingId} className={!listing.inStock ? "opacity-50" : undefined}>
                    <td className="px-4 py-3">
                      <Link href={`/dispensaries/${listing.dispensarySlug}`} className="font-medium hover:text-accent">
                        {listing.dispensaryName}
                      </Link>
                      <p className="text-xs text-fg-muted">
                        {listing.dispensaryCity}, {listing.dispensaryState}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-fg-muted">
                      {listing.packageSize}
                      {listing.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {listing.salePrice != null ? (
                        <>
                          <span className="text-success">${listing.salePrice.toFixed(2)}</span>{" "}
                          <span className="text-fg-muted line-through">${listing.price.toFixed(2)}</span>
                        </>
                      ) : (
                        `$${listing.price.toFixed(2)}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-fg-muted">${listing.pricePerUnit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={listing.inStock ? "success" : "neutral"}>
                        {listing.inStock ? "In stock" : "Out of stock"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
