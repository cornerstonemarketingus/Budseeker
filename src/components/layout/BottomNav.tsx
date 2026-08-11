"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, Map, User } from "lucide-react";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: typeof Home; isMapTrigger?: boolean };

const items: NavItem[] = [
  { href: "/explore", label: "Home", icon: Home },
  { href: "/dispensaries", label: "Explore", icon: Compass },
  { href: "#map", label: "Map", icon: Map, isMapTrigger: true },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-2/95 backdrop-blur pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = !item.isMapTrigger && pathname.startsWith(item.href);
          const Icon = item.icon;
          if (item.isMapTrigger) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("bud-seeker:open"))}
                className="flex flex-col items-center gap-1 py-2.5 text-fg-muted"
                aria-label="Open the nearby-store map"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex flex-col items-center gap-1 py-2.5", active ? "text-accent" : "text-fg-muted")}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
