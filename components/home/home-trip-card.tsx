"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { themeRegistry } from "@/data/themes";
import type { HomeTripSummary } from "@/data/home/featured-trips";
import { ThemeBackground } from "@/components/theme/theme-background";
import { TripImage } from "@/components/trip/trip-image";
import { TiltCard } from "@/components/animation/tilt-card";

export interface HomeTripCardProps {
  trip: HomeTripSummary;
}

/**
 * HomeTripCard — deliberately minimal homepage presentation: image and the
 * package name below it. Price is intentionally NOT shown here (it used to
 * be overlaid on the photo) — the full price + batch dates already live on
 * the trip detail page's "Pricing & batch dates" section, one click away,
 * so repeating an MRP figure on the homepage teaser was redundant with
 * that page. Everything else (rating, duration, group size, seats-left)
 * also lives on the trip detail page — the homepage card is just a teaser,
 * matching the reference "India Tour Packages" style module (image + name
 * only, once price was pulled).
 */
export function HomeTripCard({ trip }: HomeTripCardProps) {
  const theme = themeRegistry[trip.themeKey];

  return (
    <TiltCard>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "0px 0px -40px 0px" }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href={`/trips/${trip.slug}`}
          className="group block overflow-hidden rounded-xl border border-black/10 bg-white shadow-ub-md transition-shadow duration-ub-slow hover:shadow-ub-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <motion.div
              className="h-full w-full"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {trip.image ? (
                <TripImage asset={trip.image} theme={theme} variant="cover" containerClassName="h-full w-full rounded-none" />
              ) : (
                <ThemeBackground theme={theme} area="section" className="h-full w-full" />
              )}
            </motion.div>
          </div>

          <div className="px-3 py-3 text-center">
            <h3 className="font-display text-lg font-semibold tracking-tight text-neutral-900 [font-feature-settings:'ss01'_1,'liga'_1]">
              {trip.title}
            </h3>
          </div>
        </Link>
      </motion.div>
    </TiltCard>
  );
}
