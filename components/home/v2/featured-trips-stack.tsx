"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface FeaturedTripCardData {
  id: string;
  tag: string;
  /** Which token-based color the tag pill uses. */
  tagTone?: "brass" | "teal" | "stone";
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
}

const TONE_CLASSES: Record<NonNullable<FeaturedTripCardData["tagTone"]>, string> = {
  brass: "bg-primary text-primary-foreground",
  teal: "bg-ub-teal-500 text-white",
  stone: "bg-ub-stone-800 text-white",
};

/**
 * Homepage UI v2 — "Featured Trips" section, modeled on the reference
 * screenshot: large full-bleed trip photos stacked vertically, each with a
 * category tag, serif title, short description and a "View Trip" pill
 * button over a bottom gradient scrim.
 *
 * Static content only for now — accepts plain data, no lib/api dependency,
 * so real Trip documents can be mapped into this shape later.
 */
export function FeaturedTripsStack({
  heading = "Featured Trips",
  seeAllHref = "/trips",
  trips,
}: {
  heading?: string;
  seeAllHref?: string;
  trips: FeaturedTripCardData[];
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-8 flex flex-col items-center gap-2 text-center sm:mb-10">
        <h2 className="font-display text-3xl font-medium text-foreground sm:text-4xl">{heading}</h2>
        <Link
          href={seeAllHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-ub-teal-500 hover:underline"
        >
          See all trips
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex flex-col gap-5 sm:gap-6">
        {trips.map((trip, i) => (
          <motion.div
            key={trip.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-ub-lg sm:aspect-[16/10]"
          >
            <img
              src={trip.imageUrl}
              alt={trip.imageAlt}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" aria-hidden="true" />

            <div className="relative z-10 flex h-full flex-col justify-end gap-3 p-6 sm:p-8">
              <span
                className={cn(
                  "w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                  TONE_CLASSES[trip.tagTone ?? "brass"]
                )}
              >
                {trip.tag}
              </span>
              <h3 className="font-display text-2xl font-medium leading-tight text-white sm:text-3xl">{trip.title}</h3>
              <p className="max-w-md text-sm text-white/80 sm:text-base">{trip.description}</p>
              <Link
                href={trip.href}
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
              >
                View Trip
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
