"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";

import type { Destination } from "@/types/destination";
import { themeRegistry } from "@/data/themes";
import { TripImage } from "@/components/trip/trip-image";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Reveal } from "@/components/animation/reveal";
import { TiltCard } from "@/components/animation/tilt-card";

const cardVariants = ["up", "left", "scale", "right"] as const;

export interface ThemeExplorerSectionProps {
  /** Fetched server-side via `lib/api/destinations.ts#getHomepageVisibleDestinations`
   * (MongoDB-first, static-seed fallback — Step 7.6C-B Part 2 database rule).
   * Passed down as a prop, same pattern every other homepage section uses,
   * so this component never talks to `data/destinations/*` or MongoDB
   * itself. */
  destinations: Destination[];
}

/**
 * ThemeExplorerSection — Step 7.5B "Destinations Section". Renders one card
 * per admin-published, homepage-visible `Destination`. Adding, hiding, or
 * deleting a destination in the Admin Panel changes this section with zero
 * code edits — no hand-picked subset, no static import.
 *
 * Deliberately NOT a change to `components/destination/destination-card.tsx`
 * — that component is the shared `/destinations` listing card and changing
 * it would restyle a page this brief didn't ask to touch. This is a
 * homepage-only premium presentation of the same underlying data.
 */
export function ThemeExplorerSection({ destinations }: ThemeExplorerSectionProps) {
  if (destinations.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-section-sm sm:py-section-md">
      <SectionHeading
        eyebrow="Explore by destination"
        title="Every place, its own feel"
        description="Colors, motion, and motifs shift with where you're going — because Rajasthan and a Himalayan winter shouldn't look the same."
        className="mb-10"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.map((destination, i) => {
          const theme = themeRegistry[destination.themeKey];
          return (
            <Reveal key={destination.slug} variant={cardVariants[i % cardVariants.length]} delay={(i % 4) * 0.05}>
              <TiltCard>
                <Link
                  href={`/destinations/${destination.slug}`}
                  className="group relative isolate block overflow-hidden rounded-xl border border-white/10 shadow-ub-md transition-shadow duration-ub-slow hover:shadow-ub-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <motion.div
                    className="aspect-[3/4]"
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <TripImage asset={destination.coverImage} theme={theme} variant="cover" containerClassName="h-full rounded-none" />
                  </motion.div>

                  {/* Gradient overlay for legible text over any photo/placeholder */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />
                  {/* Extra warm gradient wash that fades in on hover */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ub-brass-900/40 to-transparent opacity-0 transition-opacity duration-ub-slow group-hover:opacity-100" aria-hidden="true" />

                  {/* Glass label plate */}
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
                    <span className="ub-glass w-fit rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white/90">
                      {destination.state}
                    </span>
                    <h3 className="font-display text-xl font-medium text-white">{destination.name}</h3>
                    <p className="flex items-center gap-1.5 text-xs text-white/75">
                      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                      {destination.tagline}
                    </p>
                  </div>

                  {/* Animated CTA — hidden until hover/focus */}
                  <span className="absolute right-3 top-3 flex size-9 translate-y-1 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-ub-md transition-all duration-ub-base group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
