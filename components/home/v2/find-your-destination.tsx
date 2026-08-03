"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ResolvedSectionBackground } from "@/lib/api/home";

/** Default full-bleed backdrop (aerial beach/coastline) used whenever the
 * admin hasn't picked a background image in Admin → Homepage 2.0. Keeps the
 * section themed even before any CMS image is configured. */
const DEFAULT_BACKGROUND_IMAGE = {
  url: "/images/find-your-destination-bg.jpg",
  alt: "Aerial view of a turquoise coastline meeting golden sand",
};

/**
 * Homepage UI v2 — "Find your destination" banner, modeled on the
 * visitabudhabi.ae reference: a full-bleed themed backdrop right under the
 * Featured Trips stack, carrying just a heading + one line of body copy
 * (no widget/form — keeps parity with the rest of `/new-home`'s
 * static-content-only sections). Admins typically pick a background crop
 * that visually continues the Featured Trips section image above it; when
 * none is set yet, `DEFAULT_BACKGROUND_IMAGE` keeps the section themed.
 *
 * Enlarged (2026-08) to be the dominant section on the page — a tall,
 * hero-scale banner (not just a slim strip) now that Fun Facts has been
 * removed from Homepage 2.0.
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
  const desktopImage = background?.backgroundImage ?? DEFAULT_BACKGROUND_IMAGE;
  const mobileImage = background?.backgroundImageMobile ?? background?.backgroundImage ?? DEFAULT_BACKGROUND_IMAGE;
  const overlayOpacity = background?.overlayOpacity ?? 0.35;

  return (
    <section
      className={cn(
        "relative flex min-h-[640px] w-full items-center justify-center overflow-hidden py-24 sm:min-h-[860px] sm:py-32",
        className
      )}
    >
      <Image
        src={mobileImage.url}
        alt={mobileImage.alt}
        fill
        sizes="100vw"
        className="absolute inset-0 object-cover md:hidden"
        unoptimized
        priority={false}
      />
      <Image
        src={desktopImage.url}
        alt={desktopImage.alt}
        fill
        sizes="100vw"
        className="absolute inset-0 hidden object-cover md:block"
        unoptimized
        priority={false}
      />
      <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto w-full max-w-2xl px-4 text-center sm:px-6"
      >
        <h2 className="font-display text-4xl font-bold text-white sm:text-6xl">{heading}</h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-white/85 sm:text-lg">{body}</p>
      </motion.div>
    </section>
  );
}
