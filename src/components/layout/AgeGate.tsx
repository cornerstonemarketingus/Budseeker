import { isAgeVerified } from "@/server/compliance/age-gate";
import { AgeGateForm } from "@/components/layout/AgeGateForm";

/**
 * Blocks all site content behind a straightforward DOB confirmation —
 * no pre-checked box, no "remember I'm over 21" shortcut, no dark
 * pattern. Minimum age is resolved server-side per jurisdiction policy.
 */
export async function AgeGate({ children }: { children: React.ReactNode }) {
  const verified = await isAgeVerified();
  if (verified) return <>{children}</>;
  return <AgeGateForm />;
}
