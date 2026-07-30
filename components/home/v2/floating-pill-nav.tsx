"use client";

import * as React from "react";
import { Search, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Homepage UI v2 — floating bottom search+menu pill, modeled on the
 * reference screenshots' teal floating control. Presentational only right
 * now: `onSearchClick`/`onMenuClick` are no-ops unless passed in, so this
 * can be wired to the existing `global-search-modal` / `mobile-nav-drawer`
 * later without changing its shape.
 */
export function FloatingPillNav({
  onSearchClick,
  onMenuClick,
}: {
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  function handleMenu() {
    setOpen((v) => !v);
    onMenuClick?.();
  }

  return (
    <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 sm:bottom-8">
      <div
        className={cn(
          "flex items-center gap-1 rounded-full p-1.5 shadow-ub-xl backdrop-blur-md",
          "bg-ub-teal-500"
        )}
      >
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Search"
          className="flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 sm:size-12"
        >
          <Search className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
        <div className="h-6 w-px bg-white/25" aria-hidden="true" />
        <button
          type="button"
          onClick={handleMenu}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 sm:size-12"
        >
          {open ? (
            <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
