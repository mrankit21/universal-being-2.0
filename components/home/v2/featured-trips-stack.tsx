"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ResolvedSectionBackground } from "@/lib/api/home";

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

/** Outline-style badge classes per tag tone — translucent dark fill with a
 * matching-tint border, per the reference screenshot's "CULTURE" /
 * "ADVENTURE" pills (not the old solid-fill pill). */
const OUTLINE_TONE_CLASSES: Record<NonNullable<FeaturedTripCardData["tagTone"]>, string> = {
  brass: "border-primary/70 text-primary-foreground bg-primary/25",
  teal: "border-ub-teal-300/80 text-white bg-ub-teal-500/25",
  stone: "border-white/70 text-white bg-black/25",
};

/**
 * Homepage UI v2 — "Featured Trips" section, restyled to match the
 * visitabudhabi.ae-style "Things To Do" reference: a centered heading with
 * a "SEE ALL" link underneath, then full-bleed cover-image cards stacked
 * vertically. Each card carries only an outlined category badge and a
 * large bold heading over the photo — no description or button; the whole
 * card is the tap target, per the reference.
 *
 * Static content only for now — accepts plain data, no lib/api dependency,
 * so real Trip documents can be mapped into this shape later. Each card's
 * `imageUrl` already resolves (in `lib/api/home2.ts`) from either a
 * homepage-only cover image override or the trip's own cover/hero image.
 */
export function FeaturedTripsStack({
  heading = "Featured Trips",
  seeAllHref = "/trips",
  trips,
  background,
}: {
  heading?: string;
  seeAllHref?: string;
  trips: FeaturedTripCardData[];
  /** Optional full-bleed backdrop behind the whole section — distinct
   * from each card's own cover image. Unset renders the plain section
   * background, same as v1's Why Travel With Us / Testimonials sections. */
  background?: ResolvedSectionBackground;
}) {
  const hasImage = Boolean(background?.backgroundImage);

  return (
    <div className={hasImage ? "relative isolate overflow-hidden" : undefined}>
      {hasImage && background?.backgroundImage ? (
        <>
          <Image
            src={(background.backgroundImageMobile ?? background.backgroundImage).url}
            alt={(background.backgroundImageMobile ?? background.backgroundImage).alt}
            fill
            sizes="100vw"
            className="absolute inset-0 object-cover md:hidden"
            unoptimized
          />
          <Image
            src={background.backgroundImage.url}
            alt={background.backgroundImage.alt}
            fill
            sizes="100vw"
            className="absolute inset-0 hidden object-cover md:block"
            unoptimized
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: background.overlayOpacity }}
            aria-hidden="true"
          />
        </>
      ) : null}

      <section className="relative mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-8 flex flex-col items-center gap-2 text-center sm:mb-10">
          <h2
            className={cn(
              "font-display text-3xl font-medium sm:text-4xl",
              hasImage ? "text-white" : "text-foreground"
            )}
          >
            {heading}
          </h2>
          <Link
            href={seeAllHref}
            className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-ub-teal-500 hover:underline"
          >
            See All
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
          >
            <Link
              href={trip.href}
              className="group relative flex aspect-[3/2] w-full flex-col items-center overflow-hidden rounded-[28px] shadow-ub-lg sm:aspect-[16/9]"
            >
              {/* Cover image — the card's full background, resolved from a
                  homepage-only override or the trip's own cover photo. */}
              <img
                src={trip.imageUrl}
                alt={trip.imageAlt}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              {/* Light, even scrim — just enough for badge/heading legibility
                  without flattening the photo like the old bottom gradient. */}
              <div className="absolute inset-0 bg-black/20" aria-hidden="true" />

              <div className="relative z-10 flex h-full w-full flex-col items-center gap-4 px-6 pt-[18%] text-center sm:pt-[15%]">
                <span
                  className={cn(
                    "w-fit rounded-md border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm sm:text-sm",
                    OUTLINE_TONE_CLASSES[trip.tagTone ?? "brass"]
                  )}
                >
                  {trip.tag}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
        </div>
      </section>
    </div>
  );
}
