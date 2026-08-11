import type { RoleGrant } from "@/server/auth/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: RoleGrant[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: RoleGrant[];
  }
}
