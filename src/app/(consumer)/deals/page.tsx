import type { Metadata } from "next";
import { listActiveDeals } from "@/server/deals/repository";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Deals" };

export default async function DealsPage() {
  const deals = await listActiveDeals();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-semibold">Active deals</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Every deal below is checked against its real start/end window — nothing here is assumed to apply.
      </p>

      <div className="mt-6 space-y-4">
        {deals.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-fg-muted">
            No active deals right now.
          </p>
        )}
        {deals.map((deal) => (
          <Card key={deal.id}>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Badge variant="accent">{deal.dealType.replace(/_/g, " ")}</Badge>
                  <h2 className="mt-2 text-lg font-semibold">{deal.title}</h2>
                  <p className="mt-1 text-sm text-fg-muted">{deal.description}</p>
                </div>
                <div className="text-right text-sm text-fg-muted">
                  <p>Ends {deal.endsAt.toLocaleDateString()}</p>
                  {deal.percentOff != null && <p className="font-mono text-lg text-success">{deal.percentOff}% off</p>}
                </div>
              </div>
              {deal.dispensaries.length > 0 && (
                <p className="mt-3 text-xs text-fg-muted">
                  Participating: {deal.dispensaries.map((d) => d.name).join(", ")}
                </p>
              )}
              {deal.terms && <p className="mt-2 text-xs text-fg-muted">{deal.terms}</p>}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
