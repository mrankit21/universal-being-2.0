"use client";

import Link from "next/link";
import { MapPin, Clock, Users, ArrowRight, Flame } from "lucide-react";
import { motion } from "framer-motion";

import { themeRegistry } from "@/data/themes";
import type { HomeTripSummary } from "@/data/home/featured-trips";
import { ThemeBackground } from "@/components/theme/theme-background";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tag } from "@/components/primitives/tag";
import { Rating } from "@/components/primitives/rating";
import { Price } from "@/components/primitives/price";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/animation/tilt-card";
import { MotionCta } from "@/components/animation/motion-cta";

export interface HomeTripCardProps {
  trip: HomeTripSummary;
}

/**
 * HomeTripCard — Step 7.5B premium pass, Step 7.5C motion pass. Same data
 * contract throughout (`HomeTripSummary`): image-zoom + hover lift +
 * gradient wash on hover, subtle desktop-only mouse tilt (`TiltCard`), a
 * fade-in on mount standing in for "blur loading" (no real remote images to
 * blur-up from yet — see the note on placeholder imagery in
 * `featured-trips.ts`), a "seats left" urgency badge, and a themed-dot
 * gallery indicator standing in for a real photo gallery.
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
        <Card className="group flex h-full flex-col overflow-hidden transition-shadow duration-ub-slow hover:shadow-ub-lg">
          <div className="relative overflow-hidden">
            <motion.div whileHover={{ scale: 1.06 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <ThemeBackground theme={theme} area="section" className="aspect-[4/3]" />
            </motion.div>

            {/* Warm gradient wash that fades in on hover, over the theme panel */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-ub-slow group-hover:opacity-100" aria-hidden="true" />

            <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
              <Tag tone="brass">{theme.name}</Tag>
              {typeof trip.seatsLeft === "number" && trip.seatsLeft <= 6 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  <Flame className="size-3" aria-hidden="true" />
                  {trip.seatsLeft} seats left
                </span>
              )}
            </div>

            {/* Gallery indicator */}
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className={i === 0 ? "h-1.5 w-4 rounded-full bg-white/90" : "h-1.5 w-1.5 rounded-full bg-white/50"} />
              ))}
            </div>
          </div>

          <CardContent className="flex flex-1 flex-col gap-2 pt-5">
            <h3 className="font-display text-lg font-medium text-foreground">{trip.title}</h3>

            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {trip.location}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                {trip.durationLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                {trip.groupSizeLabel}
              </span>
            </div>

            <Rating value={trip.rating} count={trip.reviewCount} className="mt-1" />
          </CardContent>

          <CardFooter className="flex items-center justify-between gap-3">
            <Price amount={trip.price} originalAmount={trip.originalPrice} suffix="/ person" />
            <MotionCta>
              <Button asChild size="sm">
                <Link href={`/trips/${trip.slug}`}>
                  Explore
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </MotionCta>
          </CardFooter>
        </Card>
      </motion.div>
    </TiltCard>
  );
}
