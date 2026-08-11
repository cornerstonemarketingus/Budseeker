"use server";

import { cookies } from "next/headers";
import { calculateAge, getMinAgeForRegion, AGE_GATE_COOKIE } from "@/server/compliance/age-gate";
import { db } from "@/lib/db";
import { auth } from "@/server/auth/config";

export type ConfirmAgeResult = { ok: true } | { ok: false; error: string };

export async function confirmAge(formData: FormData): Promise<ConfirmAgeResult> {
  const dobRaw = String(formData.get("dob") ?? "");
  const dob = new Date(dobRaw);
  if (Number.isNaN(dob.getTime())) {
    return { ok: false, error: "Enter a valid date of birth." };
  }

  const minAge = await getMinAgeForRegion();
  const age = calculateAge(dob);
  if (age < minAge) {
    return { ok: false, error: `You must be ${minAge} or older to use Budseeker.` };
  }

  const session = await auth();
  if (session?.user?.id) {
    await db.user.update({
      where: { id: session.user.id },
      data: { dateOfBirth: dob, ageVerifiedAt: new Date() },
    });
    await db.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "age_verification.confirmed",
        category: "COMPLIANCE",
        entityType: "User",
        entityId: session.user.id,
        after: { minAge, verifiedAt: new Date().toISOString() },
      },
    });
  }

  const store = await cookies();
  store.set(AGE_GATE_COOKIE, "1", { maxAge: 60 * 60 * 24 * 180, httpOnly: false, sameSite: "lax" });
  return { ok: true };
}
