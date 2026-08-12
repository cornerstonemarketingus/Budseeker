import type { Metadata } from "next";
import { BudSeekerApp } from "@/components/BudSeekerApp";

export const metadata: Metadata = {
  title: "Bud Seeker",
  description:
    "Search cannabis products by strain, brand, or effect, find nearby licensed dispensaries by location, and ask Bud Seeker's AI budtender for a match — free, no signup required.",
};

export default function BudSeekerPage() {
  return <BudSeekerApp />;
}
