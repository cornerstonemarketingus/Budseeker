import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const AGE_GATE_COOKIE = "budseeker_age_verified";
const DEFAULT_MIN_AGE = 21;

/** Minimum age is jurisdiction-driven data, never a hard-coded constant. */
export async function getMinAgeForRegion(region?: string): Promise<number> {
  if (!region) return DEFAULT_MIN_AGE;
  const policy = await db.jurisdictionPolicy.findFirst({ where: { region } });
  return policy?.minAge ?? DEFAULT_MIN_AGE;
}

export async function isAgeVerified(): Promise<boolean> {
  const store = await cookies();
  return store.get(AGE_GATE_COOKIE)?.value === "1";
}

export function calculateAge(dob: Date, at = new Date()): number {
  let age = at.getFullYear() - dob.getFullYear();
  const monthDiff = at.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < dob.getDate())) age--;
  return age;
}
