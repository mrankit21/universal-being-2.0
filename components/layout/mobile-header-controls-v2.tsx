"use client";

import * as React from "react";
import { Search, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useGlobalSearch } from "@/components/layout/search-context";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";

/**
 * MobileHeaderControlsV2 — Trip 2.0 / Homepage 2.0 replacement for the
 * mobile header's plain search icon + hamburger (`GlobalSearchTrigger` +
 * `MobileNavDrawer`'s own trigger). Same teal pill treatment as
 * `FloatingPillNav` (the reference design's floating search+menu
 * control), but sized for and docked inline in the header — same
 * top-right position the old icons sat in — instead of floating over the
 * page. Wired to the exact same global search modal and nav drawer as
 * every other page, just via `useGlobalSearch` + a controlled
 * `MobileNavDrawer` instead of their default uncontrolled triggers, so
 * behaviour is identical to the icons it replaces.
 */
export function MobileHeaderControlsV2() {
  const { open: openSearch } = useGlobalSearch();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1 rounded-full p-1 shadow-ub-md",
          "bg-ub-teal-500"
        )}
      >
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search"
          className="flex size-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
        >
          <Search className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
        <div className="h-4 w-px bg-white/25" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex size-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
        >
          {menuOpen ? (
            <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Menu className="size-4" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>
      <MobileNavDrawer open={menuOpen} onOpenChange={setMenuOpen} hideTrigger />
    </>
  );
}
