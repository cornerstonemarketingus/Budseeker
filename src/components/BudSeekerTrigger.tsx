"use client";

import { Sparkles } from "lucide-react";

interface BudSeekerTriggerProps {
  compact?: boolean;
}

export function BudSeekerTrigger({ compact = false }: BudSeekerTriggerProps) {
  function openBudSeeker() {
    window.dispatchEvent(new CustomEvent("bud-seeker:open"));
  }

  return (
    <button
      type="button"
      onClick={openBudSeeker}
      className={
        compact
          ? "inline-flex items-center gap-2 rounded-full bg-white/[.065] px-4 py-2 text-sm font-medium text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,.1)] backdrop-blur-[30px] transition-colors hover:bg-white/[.11] hover:text-white"
          : "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-8 text-base font-medium text-slate-950 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700"
      }
      aria-label="Open Bud Seeker"
    >
      <Sparkles className="h-5 w-5" />
      Bud Seeker
    </button>
  );
}
