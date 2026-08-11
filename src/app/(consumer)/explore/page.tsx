import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MapPin, Star, Tag } from "lucide-react";
import { listActiveDispensaries } from "@/server/dispensaries/repository";
import { listPublishedProducts } from "@/server/products/repository";
import { listActiveDeals } from "@/server/deals/repository";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage() {
  const [dispensaries, products, deals] = await Promise.all([
    listActiveDispensaries(),
    listPublishedProducts({ take: 8 }),
    listActiveDeals(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Eagan, MN &amp; nearby</p>
          <h1 className="mt-1 text-3xl font-semibold">Explore Budseeker</h1>
        </div>
        <Link href="/search" className="text-sm font-medium text-accent hover:underline">
          Search everything →
        </Link>
      </div>

      <Section title="Deals near you" href="/deals" icon={Tag}>
        {deals.length === 0 ? (
          <EmptyState message="No active deals right now — check back soon." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {deals.map((deal) => (
              <Card key={deal.id}>
                <CardBody>
                  <Badge variant="accent">{deal.dealType.replace(/_/g, " ")}</Badge>
                  <h3 className="mt-3 font-semibold">{deal.title}</h3>
                  <p className="mt-1 text-sm text-fg-muted">
                    Ends {deal.endsAt.toLocaleDateString()} · {deal.dispensaries.length} store
                    {deal.dispensaries.length === 1 ? "" : "s"}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Dispensaries near you" href="/dispensaries" icon={MapPin}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dispensaries.map((d) => (
            <Link key={d.id} href={`/dispensaries/${d.slug}`}>
              <Card className="h-full">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{d.name}</h3>
                    {d.licenseStatus === "VERIFIED" && <Badge variant="success">Verified</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    {d.city}, {d.state}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-sm text-fg-muted">
                    <Star className="h-3.5 w-3.5 fill-current text-warning" />
                    {d.ratingAverage.toFixed(1)} ({d.ratingCount})
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="New &amp; notable products" href="/products">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.brandSlug}/${p.slug}`}>
              <Card className="h-full">
                <CardBody>
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{p.categoryName}</p>
                  <h3 className="mt-1 font-semibold">{p.name}</h3>
                  <p className="text-sm text-fg-muted">{p.brandName}</p>
                  <p className="mt-3 font-mono text-lg font-semibold">
                    {p.lowestPrice != null ? `From $${p.lowestPrice.toFixed(2)}` : "Currently unavailable"}
                  </p>
                  {p.listingCount > 0 && <p className="text-xs text-fg-muted">at {p.listingCount} nearby listing{p.listingCount === 1 ? "" : "s"}</p>}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  href,
  icon: Icon,
  children,
}: {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          {Icon && <Icon className="h-4 w-4 text-accent" />}
          {title}
        </h2>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-sm text-fg-muted hover:text-accent">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-fg-muted">{message}</p>;
}
