"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** Optional leading icon (e.g. a category glyph). */
  icon?: React.ReactNode;
}

/**
 * Chip — a single toggleable choice (used to build `FilterChips`, and
 * reusable anywhere a tap-to-select pill is needed, e.g. traveler-count
 * picker in the booking flow).
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected = false, icon, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={selected}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
        "duration-ub-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent",
        className
      )}
      {...props}
    >
      {selected ? <Check className="size-3.5" aria-hidden="true" /> : icon}
      {children}
    </button>
  )
);
Chip.displayName = "Chip";
