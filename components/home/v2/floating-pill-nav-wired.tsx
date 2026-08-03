"use client";

import * as React from "react";

import { FloatingPillNav } from "@/components/home/v2/floating-pill-nav";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { useGlobalSearch } from "@/components/layout/search-context";

/**
 * FloatingPillNavWired — mounts the presentational `FloatingPillNav` on
 * Trip 2.0 pages and hooks its two buttons up to the site's *existing*
 * global chrome instead of building new search/menu UI: the search button
 * opens `GlobalSearchModal` (via `useGlobalSearch`, same provider every
 * other page already sits inside via `RootShell`), and the menu button
 * opens the same `MobileNavDrawer` content used everywhere else, just
 * without its own hamburger trigger (`hideTrigger`) since this pill
 * replaces that trigger visually.
 */
export function FloatingPillNavWired() {
  const { open: openSearch } = useGlobalSearch();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <>
      <FloatingPillNav onSearchClick={openSearch} onMenuClick={() => setMenuOpen(true)} />
      <MobileNavDrawer open={menuOpen} onOpenChange={setMenuOpen} hideTrigger />
    </>
  );
}
