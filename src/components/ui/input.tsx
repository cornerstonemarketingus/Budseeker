import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-fg outline-none placeholder:text-fg-muted",
        "focus:border-accent focus:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}
