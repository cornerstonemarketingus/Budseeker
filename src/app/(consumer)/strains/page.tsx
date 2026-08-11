import Link from "next/link";
import type { Metadata } from "next";
import { listStrains } from "@/server/strains/repository";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Strains" };

export default async function StrainsPage() {
  const strains = await listStrains();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-semibold">Strains</h1>
      <p className="mt-1 max-w-xl text-sm text-fg-muted">
        Descriptive lineage information only — not medical advice or a guarantee of effect.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {strains.map((s) => (
          <Link key={s.id} href={`/strains/${s.slug}`}>
            <Card className="h-full">
              <CardBody>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{s.name}</h2>
                  <Badge variant="accent">{s.type}</Badge>
                </div>
                {s.description && <p className="mt-1 text-sm text-fg-muted">{s.description}</p>}
                <p className="mt-3 text-xs text-fg-muted">{s.productCount} product{s.productCount === 1 ? "" : "s"}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
