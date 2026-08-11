import type { Metadata } from "next";
import { auth } from "@/server/auth/config";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { roles: true, notificationPreference: true },
  });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-3xl font-semibold">{user.name ?? "Your profile"}</h1>
      <p className="text-sm text-fg-muted">{user.email}</p>

      <Card className="mt-6">
        <CardBody>
          <h2 className="font-semibold">Roles</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.roles.length === 0 ? (
              <span className="text-sm text-fg-muted">Consumer</span>
            ) : (
              user.roles.map((r) => (
                <Badge key={r.id} variant="accent">
                  {r.role.replace(/_/g, " ").toLowerCase()}
                  {r.scopeId ? ` (scoped)` : ""}
                </Badge>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <h2 className="font-semibold">Age verification</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {user.ageVerifiedAt ? `Verified on ${user.ageVerifiedAt.toLocaleDateString()}` : "Not yet verified"}
          </p>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <h2 className="font-semibold">Notification preferences</h2>
          <ul className="mt-2 space-y-1 text-sm text-fg-muted">
            <li>Price alerts: {user.notificationPreference?.priceAlerts ?? true ? "on" : "off"}</li>
            <li>Restock alerts: {user.notificationPreference?.restockAlerts ?? true ? "on" : "off"}</li>
            <li>Deal alerts: {user.notificationPreference?.dealAlerts ?? true ? "on" : "off"}</li>
            <li>Marketing: {user.notificationPreference?.marketing ?? true ? "on" : "off"}</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
