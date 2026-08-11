import "server-only";
import { db } from "@/lib/db";
import type { RoleScopeType, UserRoleName } from "@prisma/client";

/**
 * Every role either applies platform-wide (scopeType=PLATFORM, scopeId=null)
 * or to one Merchant/Brand (scopeId = that entity's id). This is the single
 * mechanism behind "merchant_manager for Store #4" and "super_admin" alike —
 * see prisma/schema.prisma `UserRole`.
 */
export type RoleGrant = {
  role: UserRoleName;
  scopeType: RoleScopeType;
  scopeId: string | null;
};

const STAFF_ROLES: UserRoleName[] = ["SUPPORT_AGENT", "MODERATOR", "ANALYST", "ADMIN", "SUPER_ADMIN"];

export async function getUserRoles(userId: string): Promise<RoleGrant[]> {
  const roles = await db.userRole.findMany({
    where: { userId },
    select: { role: true, scopeType: true, scopeId: true },
  });
  return roles;
}

/** Platform-wide check, e.g. hasPlatformRole(roles, ["ADMIN", "SUPER_ADMIN"]). */
export function hasPlatformRole(roles: RoleGrant[], allowed: UserRoleName[]): boolean {
  return roles.some((r) => r.scopeType === "PLATFORM" && allowed.includes(r.role));
}

/** Scoped check, e.g. canManageMerchant(roles, merchantId). */
export function hasScopedRole(
  roles: RoleGrant[],
  scopeType: RoleScopeType,
  scopeId: string,
  allowed: UserRoleName[],
): boolean {
  return roles.some((r) => r.scopeType === scopeType && r.scopeId === scopeId && allowed.includes(r.role));
}

export function isStaff(roles: RoleGrant[]): boolean {
  return roles.some((r) => r.scopeType === "PLATFORM" && STAFF_ROLES.includes(r.role));
}

export function canManageMerchant(roles: RoleGrant[], merchantId: string): boolean {
  if (hasPlatformRole(roles, ["ADMIN", "SUPER_ADMIN"])) return true;
  return hasScopedRole(roles, "MERCHANT", merchantId, ["MERCHANT_OWNER", "MERCHANT_MANAGER"]);
}

export function canManageBrand(roles: RoleGrant[], brandId: string): boolean {
  if (hasPlatformRole(roles, ["ADMIN", "SUPER_ADMIN"])) return true;
  return hasScopedRole(roles, "BRAND", brandId, ["BRAND_OWNER", "BRAND_MANAGER"]);
}

/**
 * Server-side entitlement gate. Merchant/brand paid features must be checked
 * here, never inferred from a client-side flag — this is the seam Stripe
 * billing (Phase 10) wires real subscriptions into without touching callers.
 */
export async function hasEntitlement(
  owner: { merchantId?: string; brandId?: string },
  key: string,
): Promise<boolean> {
  const subscription = await db.subscription.findFirst({
    where: {
      merchantId: owner.merchantId,
      brandId: owner.brandId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: { entitlements: { where: { key } } },
    orderBy: { createdAt: "desc" },
  });
  return Boolean(subscription?.entitlements.length);
}
