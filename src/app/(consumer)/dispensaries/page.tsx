import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Star } from "lucide-react";
import { listActiveDispensaries } from "@/server/dispensaries/repository";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dispensaries" };

export default async function DispensariesPage() {
  const dispensaries = await listActiveDispensaries();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-semibold">Licensed dispensaries</h1>
      <p className="mt-1 text-sm text-fg-muted">
        {dispensaries.length} retailer{dispensaries.length === 1 ? "" : "s"} on Budseeker. License status is verified by
        Budseeker staff, never by merchant self-attestation alone.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dispensaries.map((d) => (
          <Link key={d.id} href={`/dispensaries/${d.slug}`}>
            <Card className="h-full">
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{d.name}</h2>
                  <Badge variant={d.licenseStatus === "VERIFIED" ? "success" : "warning"}>
                    {d.licenseStatus === "VERIFIED" ? "Verified" : "Pending verification"}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-fg-muted">
                  <MapPin className="h-3.5 w-3.5" /> {d.city}, {d.state}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm text-fg-muted">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-current text-warning" />
                    {d.ratingAverage.toFixed(1)} ({d.ratingCount})
                  </span>
                  <span>{d.listingCount} listing{d.listingCount === 1 ? "" : "s"}</span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
