import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg hover:brightness-110 dark:shadow-[0_0_24px_color-mix(in_srgb,var(--color-accent)_40%,transparent)] dark:hover:shadow-[0_0_32px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]",
        secondary:
          "border border-border bg-surface-2 text-fg hover:border-accent/40",
        ghost: "text-fg-muted hover:bg-surface hover:text-fg",
        danger: "bg-danger text-white hover:brightness-110",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
