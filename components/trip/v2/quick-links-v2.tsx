"use client";

import * as React from "react";
import Link from "next/link";

import { resolveTrip2Icon } from "./icon-registry";

export interface QuickLinkV2 {
  id: string;
  icon: string;
  label: string;
  href: string;
}

const DEFAULT_LINKS: QuickLinkV2[] = [
  { id: "hotels", icon: "Building2", label: "Hotels", href: "#hotel-tiers" },
  { id: "highlights", icon: "Sparkles", label: "Highlights", href: "#things-to-experience" },
  { id: "itinerary", icon: "MapIcon", label: "Itinerary", href: "#itinerary" },
  { id: "gallery", icon: "ImageIcon", label: "Gallery", href: "#gallery" },
  { id: "reviews", icon: "Star", label: "Reviews", href: "#reviews" },
  { id: "faqs", icon: "HelpCircle", label: "FAQs", href: "#faqs" },
];

/**
 * Trip 2.0 UI — quick-link tiles, sitting right under the Trip Title
 * block. Added per serial-order revision (2026-07): "3 boxes square
 * jisme baadme link add karunga (hotel, trip highlights...)".
 *
 * Reworked (2026-07, second pass) into a single horizontally-scrollable,
 * swipe-snap row of small tiles instead of a 3-col grid.
 *
 * `icon` is a plain string (resolved via `resolveTrip2Icon`), not a
 * component reference — same reason as `QUICK_LINK_ICONS` on Homepage
 * 2.0: it has to survive a round-trip through MongoDB and an admin
 * `<Select>`. Now backend-connected via `getResolvedTrip2()` /
 * `Trip2Model`; falls back to `DEFAULT_LINKS` when no `links` prop is
 * passed (e.g. the static `/new-trip` preview).
 */
export function QuickLinksV2({ links = DEFAULT_LINKS }: { links?: QuickLinkV2[] }) {
  return (
    <section className="w-full py-6 sm:py-8">
      <div className="mx-auto flex max-w-3xl gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide snap-x snap-mandatory sm:gap-4 sm:px-6">
        {links.map((link) => {
          const Icon = resolveTrip2Icon(link.icon);
          return (
            <Link
              key={link.id}
              href={link.href}
              className="flex w-20 shrink-0 snap-start flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 sm:w-24 sm:p-3.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary sm:size-10">
                <Icon className="size-4 sm:size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="text-[11px] font-medium leading-tight text-foreground sm:text-xs">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
