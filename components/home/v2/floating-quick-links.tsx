"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bus,
  MapPinned,
  Route,
  Compass,
  Ticket,
  Mountain,
  Plane,
  Car,
  Map,
  Sparkles,
  Home,
  Star,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/** Icon names selectable from the "Homepage 2.0" admin panel for
 * "icon"-variant tiles. Keeping this as a name→component map (rather than
 * passing a component reference in `QuickLinkItem`) is what lets a tile's
 * icon be stored as a plain string in MongoDB and picked from a `<Select>`
 * in the admin UI. */
export const QUICK_LINK_ICONS: Record<string, LucideIcon> = {
  Bus,
  MapPinned,
  Route,
  Compass,
  Ticket,
  Mountain,
  Plane,
  Car,
  Map,
  Sparkles,
  Home,
  Star,
};
export type QuickLinkIconName = keyof typeof QUICK_LINK_ICONS;
export const QUICK_LINK_ICON_NAMES = Object.keys(QUICK_LINK_ICONS) as QuickLinkIconName[];

export interface QuickLinkItem {
  title: string;
  href: string;
  /**
   * Tile shape:
   * - "featured" — the big spotlight card at the top (image thumbnail +
   *   tag + title). There should only be one of these, and it renders
   *   full-width regardless of `wide`.
   * - "image" — half-width card with a background photo and the title
   *   overlaid at the bottom (e.g. "Hotels" in the reference).
   * - "icon" — half-width (or full-width when `wide`) card with an icon
   *   chip and title, no photo (e.g. "Transport", "Build Your Itinerary").
   */
  variant: "featured" | "image" | "icon";
  /** Icon name for "icon"-variant tiles — looked up in `QUICK_LINK_ICONS`.
   * Admin/DB-driven, so this is a string, not a component reference. */
  icon?: string;
  /** Background photo for "featured" and "image"-variant tiles. */
  imageUrl?: string;
  imageAlt?: string;
  /** Small pill label on the "featured" tile (e.g. "Featured"). */
  tag?: string;
  /** Optional short description, shown only on "icon"-variant tiles. */
  description?: string;
  /** Span both columns. Ignored for "featured", which is always full-width. */
  wide?: boolean;
}

export const DEFAULT_LINKS: QuickLinkItem[] = [
  {
    variant: "featured",
    tag: "Featured",
    title: "Explore Trips",
    href: "/trips",
    imageUrl:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800&auto=format&fit=crop",
    imageAlt: "Illuminated palace reflected in a lake at dusk",
  },
  {
    variant: "icon",
    icon: "Bus",
    title: "Transport",
    description: "Where every journey begins and takes you further.",
    href: "/transport",
  },
  {
    variant: "icon",
    icon: "MapPinned",
    title: "Destinations",
    description: "Explore top destinations and hidden gems across India.",
    href: "/destinations",
  },
  {
    variant: "image",
    title: "Hotels",
    href: "/hotels",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
    imageAlt: "Beachfront hotel pool at sunset",
  },
  {
    variant: "image",
    title: "Offers",
    href: "/offers",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    imageAlt: "Desert dunes at sunset",
  },
  {
    variant: "icon",
    icon: "Route",
    title: "Build Your Itinerary",
    description: "Customise your perfect trip, your way.",
    href: "/itinerary",
    wide: true,
  },
];

/**
 * Homepage UI v2 — floating quick-link tiles, modeled on the reference
 * screenshot's mixed grid: one full-width "spotlight" card with a photo
 * thumbnail, two plain icon tiles side by side, one photo tile, and a
 * full-width icon bar at the end.
 *
 * Static/presentational only for now (no data-fetching): props default to
 * DEFAULT_LINKS so this can be swapped for admin/CMS-driven data later
 * without changing the component's shape.
 */
export function FloatingQuickLinks({ items = DEFAULT_LINKS, className }: { items?: QuickLinkItem[]; className?: string }) {
  return (
    <div
      className={cn(
        "relative z-20 mx-auto -mt-16 grid w-full max-w-5xl grid-cols-2 gap-3 px-4 sm:-mt-20 sm:gap-4 sm:px-6",
        className
      )}
    >
      {items.map((item, i) => {
        const spanClass = item.variant === "featured" || item.wide ? "col-span-2" : "col-span-1";

        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={spanClass}
          >
            {item.variant === "featured" ? (
              <FeaturedTile item={item} />
            ) : item.variant === "image" ? (
              <ImageTile item={item} />
            ) : (
              <IconTile item={item} wide={item.wide} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function FeaturedTile({ item }: { item: QuickLinkItem }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-white/10 bg-ub-ink-900/70 p-4 backdrop-blur-md",
        "shadow-ub-lg transition-colors hover:bg-ub-ink-900/85 sm:gap-6 sm:p-5"
      )}
    >
      <span className="min-w-0 flex-1">
        {item.tag ? (
          <span className="mb-2 inline-block rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ub-ink-900 sm:text-xs">
            {item.tag}
          </span>
        ) : null}
        <span className="block text-lg font-semibold text-white sm:text-xl">{item.title}</span>
      </span>
      {item.imageUrl ? (
        <span className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl sm:w-36">
          <img
            src={item.imageUrl}
            alt={item.imageAlt ?? ""}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </span>
      ) : null}
    </Link>
  );
}

function ImageTile({ item }: { item: QuickLinkItem }) {
  return (
    <Link
      href={item.href}
      className="group relative flex h-32 overflow-hidden rounded-xl shadow-ub-lg sm:h-36"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.imageAlt ?? ""}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden="true" />
      <span className="relative mt-auto block p-4 text-sm font-semibold uppercase tracking-wide text-white sm:text-base">
        {item.title}
      </span>
    </Link>
  );
}

function IconTile({ item, wide }: { item: QuickLinkItem; wide?: boolean }) {
  const Icon = item.icon ? QUICK_LINK_ICONS[item.icon] : undefined;
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex h-full items-center gap-3 rounded-xl border border-white/10 bg-ub-ink-900/70 p-4 backdrop-blur-md",
        "shadow-ub-lg transition-colors hover:bg-ub-ink-900/85 sm:gap-4 sm:p-5"
      )}
    >
      {Icon ? (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary sm:size-12">
          <Icon className="size-5 sm:size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-semibold uppercase tracking-wide text-white sm:text-base">
          {item.title}
        </span>
        {item.description && !wide ? (
          <span className="mt-0.5 block truncate text-xs text-white/60 group-hover:text-white/80 sm:text-sm sm:whitespace-normal">
            {item.description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
