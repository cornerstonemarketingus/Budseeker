"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Leaf, Search, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/explore", label: "Home" },
  { href: "/dispensaries", label: "Dispensaries" },
  { href: "/brands", label: "Brands" },
  { href: "/strains", label: "Strains" },
  { href: "/deals", label: "Deals" },
];

export function AppHeader() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
        <Link href="/explore" className="flex items-center gap-2 font-semibold text-fg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
            <Leaf className="h-4 w-4" />
          </span>
          Budseeker
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-fg-muted md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-fg">
              {link.label}
            </Link>
          ))}
        </nav>

        <form action="/search" className="ml-auto hidden max-w-sm flex-1 items-center gap-2 md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, stores, brands…"
              className="h-10 w-full rounded-full border border-border bg-surface px-9 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-fg-muted hover:text-fg">
                <User className="h-[18px] w-[18px]" />
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-surface-2 px-3 text-sm font-semibold text-fg hover:border-accent/40"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
