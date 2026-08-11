import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getStrainBySlug } from "@/server/strains/repository";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const strain = await getStrainBySlug(slug);
  return { title: strain?.name ?? "Strain" };
}

export default async function StrainDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const strain = await getStrainBySlug(slug);
  if (!strain) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-semibold">{strain.name}</h1>
        <Badge variant="accent">{strain.type}</Badge>
      </div>
      {strain.description && <p className="mt-2 max-w-xl text-fg-muted">{strain.description}</p>}
      <p className="mt-1 text-xs text-fg-muted">Descriptive lineage only — not medical advice.</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Products with this strain</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {strain.products.map((p) => (
            <Link key={p.id} href={`/products/${p.brandSlug}/${p.slug}`}>
              <Card className="h-full">
                <CardBody>
                  <Badge variant="neutral">{p.categoryName}</Badge>
                  <h3 className="mt-2 font-semibold">{p.name}</h3>
                  <p className="text-sm text-fg-muted">{p.brandName}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
