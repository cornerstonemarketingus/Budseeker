import type { Metadata } from "next";
import { Bike, Leaf, Lock, Map, MessageCircle, Store } from "lucide-react";
import { BudSeekerTrigger } from "@/components/BudSeekerTrigger";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Bud Seeker | Cannabis Product & Dispensary Guide",
};

const steps = [
  {
    icon: MessageCircle,
    title: "Tell the guide what you want",
    description: "Describe the experience, format, and strength you're after in plain language.",
  },
  {
    icon: Leaf,
    title: "Get matched to real products",
    description: "The guide compares your request against a live, in-stock catalog — no guesswork.",
  },
  {
    icon: Map,
    title: "Find delivery or pickup nearby",
    description: "See mapped, licensed retailers near you, sorted by distance and how you want it fulfilled.",
  },
] as const;

const features = [
  {
    icon: MessageCircle,
    title: "AI product guide",
    description: "A private budtender-style chat that knows the current menu and answers strain, dosing, and format questions.",
  },
  {
    icon: Map,
    title: "Mapped nearby retailers",
    description: "Search any city or ZIP, or use your current location, to see licensed dispensaries plotted on a live map.",
  },
  {
    icon: Bike,
    title: "Delivery vs. pickup filters",
    description: "Filter results by what each store actually offers, so you're not calling around to check.",
  },
  {
    icon: Lock,
    title: "Private by design",
    description: "Access is gated behind a simple email signup — no accounts, no tracking beyond what's needed.",
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-400 dark:neon-text">Adults 21+ · AI product guide</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">
              Find the right product.<br />
              <span className="text-emerald-700 dark:text-emerald-400 dark:neon-text">Find it near you.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-zinc-400">
              Bud Seeker is a private AI guide that matches you to the right cannabis product, then maps
              licensed retailers near you — with delivery and pickup clearly marked.
            </p>
            <div className="mt-9 flex justify-center">
              <BudSeekerTrigger />
            </div>
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
            <h2 className="mt-4 text-3xl font-semibold dark:text-white">Ready to find your next pickup — or delivery?</h2>
            <p className="mx-auto mt-3 max-w-md text-emerald-50 dark:text-zinc-400">
              Join with your email and start exploring licensed retailers near you today.
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
