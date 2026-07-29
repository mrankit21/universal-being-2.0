"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * TripSectionNav — premium sticky horizontal navigation strip for the Trip
 * Detail Page. Sits directly below the Book Now box and lets visitors jump
 * to any section (Pricing, Highlights, Hotels, Itinerary, Inclusions,
 * Exclusions, Gallery, FAQ, Policies) instead of scrolling through a long
 * page.
 *
 * Structural, not content-driven — it never needs its own CMS entry.
 * Every candidate section already self-hides when its data is empty (same
 * pattern as `TripInclusions`/`TripFAQ`/etc across this codebase); this
 * component simply checks, once after hydration, which of those section
 * ids actually landed in the DOM and builds its tab list from that. A
 * label can name more than one candidate id (see `ids`) — e.g. "Hotels"
 * resolves to whichever of Accommodation / Hotel Category rendered first —
 * without merging those sections' own markup or logic.
 */
export interface TripSectionNavItem {
  /** Candidate element ids, in preference order. The first one present in
   * the DOM becomes this tab's scroll target and active-state target. */
  ids: string[];
  label: string;
}

interface ResolvedTab {
  label: string;
  targetId: string;
}

/** Both `DesktopHeader` and `MobileHeader` are a sticky `h-16` (64px) once
 * the page has scrolled — which it always has by the time this strip can
 * stick, since its own sticky offset sits right below the header. */
const HEADER_OFFSET = 64;
/** Approx height of this strip itself, so `scrollTo` doesn't tuck the
 * target section's heading behind the sticky strip. */
const STRIP_OFFSET = 56;
const SCROLL_PADDING = HEADER_OFFSET + STRIP_OFFSET + 16;

export function TripSectionNav({ items }: { items: TripSectionNavItem[] }) {
  const [tabs, setTabs] = React.useState<ResolvedTab[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Resolve which sections actually exist (and rendered non-empty) once,
  // right after hydration. The page is server-rendered, so the DOM is
  // already final by the time this effect runs — no polling/mutation
  // watching needed.
  React.useEffect(() => {
    const found: ResolvedTab[] = [];
    for (const item of items) {
      const targetId = item.ids.find((id) => document.getElementById(id));
      if (targetId) found.push({ label: item.label, targetId });
    }
    setTabs(found);
  }, [items]);

  // Scrollspy: highlight whichever section is currently under the sticky
  // strip. rootMargin pulls the "detection line" down below the
  // header + strip, and collapses the bottom of the viewport so only one
  // section is realistically intersecting that thin band at a time.
  React.useEffect(() => {
    if (tabs.length === 0) return;

    const elements = tabs
      .map((tab) => document.getElementById(tab.targetId))
      .filter((el): el is HTMLElement => !!el);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((entry) => entry.isIntersecting);
        if (intersecting.length === 0) return;
        // Prefer the one closest to the top of the detection band, so fast
        // scrolls past a short section don't get stuck on a section below it.
        const topMost = intersecting.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b
        );
        setActiveId(topMost.target.id);
      },
      { rootMargin: `-${SCROLL_PADDING}px 0px -65% 0px`, threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    setActiveId((current) => current ?? elements[0].id);

    return () => observer.disconnect();
  }, [tabs]);

  // Keep the active pill scrolled into view within the horizontal strip
  // itself, so an active tab off-screen (mobile) auto-centers into view.
  React.useEffect(() => {
    if (!activeId || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-target-id="${activeId}"]`);
    activeEl?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeId]);

  if (tabs.length === 0) return null;

  const handleClick = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_PADDING;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveId(targetId);
  };

  return (
    <nav
      aria-label="Trip page sections"
      className="ub-glass sticky top-16 z-30 w-full border-b border-border/60 bg-background/95"
    >
      <div
        ref={listRef}
        className="scrollbar-hide mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 py-3 sm:justify-center sm:overflow-visible sm:gap-2.5"
      >
        {tabs.map(({ label, targetId }) => {
          const isActive = activeId === targetId;
          return (
            <button
              key={targetId}
              type="button"
              data-target-id={targetId}
              onClick={() => handleClick(targetId)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium",
                "transition-all duration-200 ease-out active:scale-95",
                isActive
                  ? "border-transparent bg-ub-brass-500 text-white shadow-ub-sm"
                  : "border-border bg-card text-muted-foreground hover:border-ub-brass-300 hover:text-foreground"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Canonical section list for the (non-pickup-variant) Trip Detail Page
 * composition. Kept here, next to the component, as the single source of
 * truth `page.tsx` imports — so a future section (Reviews, Signature
 * Journeys, a new pickup-variant sub-section, etc.) is added in exactly
 * one place. Order follows the page's actual DOM order for a natural
 * scrollspy feel; unresolved ids simply never produce a tab.
 */
export const TRIP_SECTION_NAV_ITEMS: TripSectionNavItem[] = [
  { ids: ["trip-batches"], label: "Pricing & Batch Dates" },
  { ids: ["trip-gallery"], label: "Gallery" },
  { ids: ["trip-highlights"], label: "Trip Highlights" },
  { ids: ["trip-itinerary"], label: "Itinerary" },
  { ids: ["trip-accommodation", "trip-hotel-categories"], label: "Hotels" },
  { ids: ["trip-inclusions"], label: "Inclusions" },
  { ids: ["trip-exclusions"], label: "Exclusions" },
  { ids: ["trip-faq"], label: "FAQ" },
  { ids: ["trip-policies"], label: "Policies" },
];
