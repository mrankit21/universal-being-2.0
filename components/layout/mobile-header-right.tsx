"use client";

import { usePathname } from "next/navigation";

import { GlobalSearchTrigger } from "@/components/layout/global-search-trigger";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { MobileHeaderControlsV2 } from "@/components/layout/mobile-header-controls-v2";

/**
 * MobileHeaderRight — the two controls on the right side of the mobile
 * header. Needs `usePathname()` (client-only) to tell a Trip 2.0 page
 * apart from a v1 one, which is why this one small piece is split out of
 * the otherwise-server `MobileHeader` rather than making that whole file
 * a client component (same reasoning as `HideOnAdmin` in `root-shell.tsx`).
 *
 * v1 pages (and v1 homepage) keep the original icon-only search trigger +
 * hamburger drawer, completely unchanged. Trip 2.0 pages (`/trip2/**`)
 * and the homepage when Homepage 2.0 is active (`homepage2Active`, read
 * from Site Settings by the server-side `MobileHeader` and passed in as a
 * prop) get the new teal pill controls instead, in the exact same header
 * position — Ankit's ask (2026-08) to replace the old search bar + 3-line
 * icon with the new Search/Menu buttons "same position, same UI/UX" on
 * just those pages, leaving v1 untouched.
 */
export function MobileHeaderRight({ homepage2Active }: { homepage2Active: boolean }) {
  const pathname = usePathname();
  const isTrip2 = pathname?.startsWith("/trip2") ?? false;
  const isV2 = isTrip2 || (pathname === "/" && homepage2Active);

  if (isV2) return <MobileHeaderControlsV2 />;

  return (
    <>
      <GlobalSearchTrigger variant="icon" />
      <MobileNavDrawer />
    </>
  );
}
