"use client";

import Link from "next/link";
import { Building2, Compass, MapPinned, Navigation, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { NearbyDispensaries } from "@/components/NearbyDispensaries";
import { ThemeToggle } from "@/components/ThemeToggle";

export function BudSeekerApp() {
  const [requestNearby, setRequestNearby] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("nearby") !== "1") return;
    setRequestNearby(true);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash}`);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f5f2] text-zinc-950 dark:bg-[#090b09] dark:text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#f8f9f6]/95 backdrop-blur dark:border-white/10 dark:bg-[#090b09]/90">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-950 text-emerald-300 shadow-sm dark:bg-emerald-400 dark:text-zinc-950"><Compass className="h-5 w-5" /></span>
            <span className="truncate text-sm font-semibold tracking-[0.12em]">BUDSEEKER</span>
            <span className="hidden border-l border-zinc-300 pl-3 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400 sm:inline">Retailer intelligence</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 md:inline-flex"><ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />Licensed retailer directory</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8">
        <section className="border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(24,28,20,0.06)] dark:border-white/10 dark:bg-[#111411] sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Minnesota directory</p>
              <h1 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">Find licensed dispensaries with a cleaner view of the field.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">Search any city or ZIP, share your location, then compare nearby operators on the map and in the directory.</p>
            </div>
            <div className="grid grid-cols-2 border border-zinc-200 dark:border-white/10">
              <div className="border-r border-zinc-200 p-4 dark:border-white/10"><p className="text-2xl font-semibold">119</p><p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">Licensed listings</p></div>
              <div className="p-4"><p className="text-2xl font-semibold">Live</p><p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">OCM directory</p></div>
            </div>
          </div>
        </section>

        <section className="mt-5 border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#111411]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><MapPinned className="h-4 w-4" /></span>
              <div><h2 className="text-sm font-semibold">Directory search</h2><p className="text-xs text-zinc-500 dark:text-zinc-400">Map, distance, retailer details, and directions.</p></div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"><Building2 className="h-3.5 w-3.5" />Statewide coverage</span>
          </div>
          <div className="p-5 sm:p-6"><NearbyDispensaries autoLocate={requestNearby} /></div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 pb-7 text-[11px] text-zinc-500 sm:px-6"><Navigation className="h-3.5 w-3.5" />Verify hours, menus, and licensing directly with each retailer.</footer>
    </div>
  );
}
