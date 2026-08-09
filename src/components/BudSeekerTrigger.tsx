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
          ? "inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
          : "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 text-base font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
      }
      aria-label="Open Bud Seeker"
    >
      <Sparkles className="h-5 w-5" />
      Bud Seeker
    </button>
  );
}
