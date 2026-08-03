"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ResolvedSectionBackground } from "@/lib/api/home";

/**
 * Homepage UI v2 — "Find your destination" banner, modeled on the
 * visitabudhabi.ae reference: a full-bleed themed backdrop right under the
 * Featured Trips stack, carrying just a heading + one line of body copy
 * (no widget/form — keeps parity with the rest of `/new-home`'s
 * static-content-only sections). Admins typically pick a background crop
 * that visually continues the Featured Trips section image above it.
 */
export function FindYourDestination({
  heading = "Find your destination",
  body = "Your next adventure is waiting. Discover amazing places with Universal Being.",
  background,
  className,
}: {
  heading?: string;
  body?: string;
  background?: ResolvedSectionBackground;
  className?: string;
}) {
  const hasImage = Boolean(background?.backgroundImage);

  return (
    <section className={cn("relative w-full overflow-hidden bg-ub-stone-100 py-16 sm:py-24", className)}>
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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto w-full max-w-xl px-4 text-center sm:px-6"
      >
        <h2
          className={cn(
            "font-display text-3xl font-bold sm:text-4xl",
            hasImage ? "text-white" : "text-foreground"
          )}
        >
          {heading}
        </h2>
        <p
          className={cn(
            "mx-auto mt-4 max-w-md text-base",
            hasImage ? "text-white/85" : "text-muted-foreground"
          )}
        >
          {body}
        </p>
      </motion.div>
    </section>
  );
}
