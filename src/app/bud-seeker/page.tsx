import type { Metadata } from "next";
import { BudSeekerApp } from "@/components/BudSeekerApp";

export const metadata: Metadata = {
  title: "BudSeeker | Licensed Dispensary Directory",
  description:
    "Search Minnesota licensed dispensaries by city, ZIP, or shared location.",
};

export default function BudSeekerPage() {
  return <BudSeekerApp />;
}
