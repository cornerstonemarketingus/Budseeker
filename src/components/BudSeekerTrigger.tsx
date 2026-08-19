import Link from "next/link";

interface BudSeekerTriggerProps {
  compact?: boolean;
}

export function BudSeekerTrigger({ compact = false }: BudSeekerTriggerProps) {
  return (
    <Link
      href="/bud-seeker?nearby=1"
      className={
        compact
          ? "inline-flex items-center rounded-[var(--radius-button)] border border-[var(--border-hairline)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]"
          : "inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent-gold)] px-7 font-medium text-[var(--bg-primary)]"
      }
    >
      Ask Bud Seeker
    </Link>
  );
}
