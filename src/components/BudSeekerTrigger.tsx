import Link from "next/link";
import { Sparkles } from "lucide-react";

interface BudSeekerTriggerProps {
  compact?: boolean;
}

export function BudSeekerTrigger({ compact = false }: BudSeekerTriggerProps) {
  return (
    <Link
      href="/bud-seeker"
      className={
        compact
          ? "inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:shadow-[0_0_0_1px_rgba(52,255,156,.3)] dark:hover:shadow-[0_0_0_1px_rgba(52,255,156,.5),0_0_18px_rgba(52,255,156,.25)]"
          : "inline-flex h-16 items-center justify-center gap-2.5 rounded-full bg-emerald-600 px-12 text-xl font-semibold text-white shadow-[0_10px_30px_rgba(5,150,105,.35)] transition-all hover:-translate-y-1 hover:scale-[1.03] hover:bg-emerald-700 hover:shadow-[0_14px_40px_rgba(5,150,105,.45)] dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_40px_rgba(52,255,156,.5)] dark:hover:shadow-[0_0_55px_rgba(52,255,156,.7)]"
      }
    >
      <Sparkles className="h-6 w-6" />
      Bud Seeker
    </Link>
  );
}
