import type { Metadata } from "next";
import { Bike, Leaf, Lock, Map, MessageCircle, Store } from "lucide-react";
import { BudSeekerTrigger } from "@/components/BudSeekerTrigger";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Bud Seeker | Skip the Menu. Get Matched Instantly.",
  description:
    "Stop scrolling menus. Search by strain or ask Bud Seeker what you want and get matched to real, in-stock cannabis products in seconds — then find exactly which nearby stores have it, delivery or pickup. Free, instant, no signup, 21+.",
};

const steps = [
  {
    icon: MessageCircle,
    title: "Say what you're after",
    description: "No menus to scroll. Just describe the vibe, strength, or format — like texting a friend who works there.",
  },
  {
    icon: Leaf,
    title: "Get matched, not guessed",
    description: "It checks what's actually in stock right now and hands you real picks, not generic suggestions.",
  },
  {
    icon: Map,
    title: "Get it however you want",
    description: "See which nearby stores have it, ranked by distance, with delivery and pickup called out clearly.",
  },
] as const;

const features = [
  {
    icon: MessageCircle,
    title: "Never scroll a menu again",
    description: "Describe what you want in plain English and get matched instantly — like having a budtender in your pocket, on call anytime.",
  },
  {
    icon: Map,
    title: "Know exactly where to go",
    description: "Search any city or ZIP, or use your location, and see every licensed store plotted on a live map — closest first.",
  },
  {
    icon: Bike,
    title: "Delivery or pickup, your call",
    description: "Filter for exactly what you need so you're never stuck calling around to check what a store actually offers.",
  },
  {
    icon: Lock,
    title: "No signup. No spam.",
    description: "No email, no password, no account to create. Search and chat instantly — nothing to remember, nothing to clutter your inbox.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-950 dark:bg-black dark:text-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_20px_rgba(52,255,156,.5)]"><Leaf className="h-4 w-4" /></span>
            Bud Seeker
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <BudSeekerTrigger compact />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 hidden dark:block">
            <div className="grid-glow absolute inset-0" />
            <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-emerald-500/20 blur-[160px]" />
          </div>
          <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-400 dark:neon-text">Free · Instant · 21+</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">
              Skip the guesswork.<br />
              <span className="text-emerald-700 dark:text-emerald-400 dark:neon-text">Get matched instantly.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-zinc-400">
              Search by strain, tell Bud Seeker what you&apos;re after, or share your location — get matched to
              real, in-stock products in seconds and see exactly which nearby stores have it, delivery
              or pickup, ready to go.
            </p>
            <div className="mt-9 flex justify-center">
              <BudSeekerTrigger />
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-zinc-500">No email. No signup. Just open it and go.</p>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-20 dark:border-white/10 dark:bg-white/[.015]">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-semibold sm:text-4xl">How it works</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:shadow-[0_0_0_1px_rgba(52,255,156,.25),0_0_20px_rgba(52,255,156,.2)]">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Step {index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-slate-200 bg-white p-6 transition dark:border-white/10 dark:bg-white/[.02] dark:hover:border-emerald-400/40 dark:hover:shadow-[0_0_28px_rgba(52,255,156,.12)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-24">
          <div className="rounded-[2rem] bg-emerald-700 px-8 py-14 text-center text-white dark:bg-black dark:border dark:border-emerald-400/30 dark:shadow-[0_0_0_1px_rgba(52,255,156,.2),0_0_60px_rgba(52,255,156,.15)]">
            <Store className="mx-auto h-8 w-8 dark:text-emerald-400 dark:drop-shadow-[0_0_14px_rgba(52,255,156,.6)]" />
            <h2 className="mt-4 text-3xl font-semibold dark:text-white">Your next favorite product is one search away.</h2>
            <p className="mx-auto mt-3 max-w-md text-emerald-50 dark:text-zinc-400">
              Start matching with real products at stores near you — free, instant, no menus, no calling around.
            </p>
            <div className="mt-7 flex justify-center">
              <BudSeekerTrigger />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 dark:border-white/10 dark:bg-black">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-slate-500 dark:text-zinc-600">
          <p>Bud Seeker · Adults 21+ only · Not medical advice</p>
          <p className="mt-1">Retailer listings are informational and sourced from public map data; they are not an endorsement or guarantee of licensure. Confirm details directly with each retailer.</p>
        </div>
      </footer>
    </div>
  );
}
