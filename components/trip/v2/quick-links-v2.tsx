"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

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
    <section className="w-full border-y border-border/60 bg-card/40 py-4 sm:py-5">
      <div className="mx-auto flex max-w-3xl items-start gap-6 overflow-x-auto px-4 pb-1 scrollbar-hide snap-x snap-mandatory sm:justify-between sm:gap-2 sm:overflow-visible sm:px-6">
        {links.map((link, i) => {
          const Icon = resolveTrip2Icon(link.icon);
          return (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 snap-start"
            >
              <Link
                href={link.href}
                className="flex flex-col items-center gap-1.5 text-center transition-colors hover:text-primary"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary sm:size-9">
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="whitespace-nowrap text-[11px] font-semibold leading-tight text-foreground sm:text-xs">{link.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
