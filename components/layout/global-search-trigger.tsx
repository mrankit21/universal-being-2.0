"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useGlobalSearch } from "@/components/layout/search-context";

export interface GlobalSearchTriggerProps {
  className?: string;
  /** Compact = icon-only (mobile header); full = pill with shortcut hint (desktop). */
  variant?: "icon" | "full";
}

/**
 * GlobalSearchTrigger — opens GlobalSearchModal via GlobalSearchProvider.
 * The "full" variant surfaces the ⌘K/Ctrl+K hint so the shortcut is
 * discoverable, not just functional.
 */
export function GlobalSearchTrigger({ className, variant = "icon" }: GlobalSearchTriggerProps) {
  const { open } = useGlobalSearch();

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={open}
        aria-label="Search"
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-sm text-muted-foreground transition-colors",
          "hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className
        )}
      >
        <Search className="size-4" aria-hidden="true" />
        <span>Search</span>
        <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search"
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <Search className="size-5" aria-hidden="true" />
    </button>
  );
}
