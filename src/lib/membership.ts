import { db } from "@/lib/db";

export async function isMember(email: string | null | undefined): Promise<boolean> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  const subscriber = await db.newsletterSubscriber.findUnique({ where: { email: normalized }, select: { id: true } });
  return Boolean(subscriber);
}

export const MEMBERSHIP_REQUIRED_RESPONSE = { error: "Email signup is required to use Bud Seeker." } as const;
