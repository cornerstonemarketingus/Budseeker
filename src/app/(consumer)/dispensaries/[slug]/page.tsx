import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, MapPin, Navigation, Star } from "lucide-react";
import { getDispensaryBySlug, getDispensaryListings } from "@/server/dispensaries/repository";
import { Badge } from "@/components/ui/badge";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dispensary = await getDispensaryBySlug(slug);
  return { title: dispensary?.name ?? "Dispensary" };
}

export default async function DispensaryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dispensary = await getDispensaryBySlug(slug);
  if (!dispensary) notFound();

  const listings = await getDispensaryListings(dispensary.id);
  const directionsHref = `https://www.openstreetmap.org/directions?to=${dispensary.latitude},${dispensary.longitude}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold">{dispensary.name}</h1>
            <Badge variant={dispensary.licenseStatus === "VERIFIED" ? "success" : "warning"}>
              {dispensary.licenseStatus === "VERIFIED" ? "License verified" : "Verification pending"}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-fg-muted">
            <MapPin className="h-4 w-4" /> {dispensary.address1}, {dispensary.city}, {dispensary.state}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-fg-muted">
            <Star className="h-4 w-4 fill-current text-warning" /> {dispensary.ratingAverage.toFixed(1)} (
            {dispensary.ratingCount} review{dispensary.ratingCount === 1 ? "" : "s"})
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={directionsHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg hover:brightness-110"
          >
            <Navigation className="h-4 w-4" /> Directions
          </a>
        </div>
      </div>

      {dispensary.description && <p className="mt-6 max-w-2xl text-fg-muted">{dispensary.description}</p>}

      <section className="mt-8 grid gap-6 sm:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Clock className="h-4 w-4 text-accent" /> Hours
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-fg-muted">
            {dispensary.hours.map((h) => (
              <li key={h.dayOfWeek} className="flex justify-between">
                <span>{DAY_LABELS[h.dayOfWeek]}</span>
                <span>{h.closed ? "Closed" : `${h.opensAt} – ${h.closesAt}`}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">Contact</h2>
          <ul className="mt-3 space-y-1 text-sm text-fg-muted">
            {dispensary.phone && <li>{dispensary.phone}</li>}
            {dispensary.website && (
              <li>
                <a href={dispensary.website} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  {dispensary.website}
                </a>
              </li>
            )}
            <li>
              Menu last synced{" "}
              {dispensary.lastMenuSyncAt ? new Date(dispensary.lastMenuSyncAt).toLocaleString() : "unknown"}
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">On the menu</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-4 py-3">
                    <Link href={`/products/${listing.brandSlug}/${listing.productSlug}`} className="font-medium hover:text-accent">
                      {listing.productName}
                    </Link>
                    <p className="text-xs text-fg-muted">{listing.brandName}</p>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{listing.categoryName}</td>
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
                  <td className="px-4 py-3 text-right">
                    <Badge variant={listing.inStock ? "success" : "neutral"}>{listing.inStock ? "In stock" : "Out of stock"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
