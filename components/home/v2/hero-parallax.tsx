"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { ParallaxImageLayer } from "@/components/animation/parallax-image-layer";
import { cn } from "@/lib/utils";

export interface HeroParallaxProps {
  eyebrow?: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  /** Background shown on tablet/desktop (≥768px). */
  imageUrl: string;
  imageAlt: string;
  /** Optional separate background for phone viewports (<768px) — falls
   * back to `imageUrl`/`imageAlt` when unset. Useful because a wide
   * laptop-shot photo often crops badly on a phone even with `bg-cover`. */
  imageMobileUrl?: string;
  imageMobileAlt?: string;
  className?: string;
}

/**
 * Homepage UI v2 — hero section modeled on visitabudhabi.ae's "Find your
 * pace" opener: a destination photo that stays almost still while the
 * headline and every section below scroll normally over it, a large
 * serif headline, and a scroll cue.
 *
 * Revision (2026-08): the background is now a genuine scroll-linked
 * parallax (`ParallaxImageLayer`, built on Framer Motion's `useScroll` +
 * `useTransform`) instead of `background-attachment: fixed`. `bg-fixed`
 * pins the image to the viewport — cheap, but historically inconsistent
 * on iOS Safari inside scroll containers, and reads as "glued to screen"
 * rather than the reference's slight drift. The transform-based version
 * drifts the photo at ~16% of scroll speed, is GPU-composited (translateY
 * only), and degrades gracefully under `prefers-reduced-motion`.
 *
 * Static content only for now — no data-fetching, so this can sit at a
 * preview route and be swapped for CMS-driven props later without
 * changing its shape.
 */
export function HeroParallax({
  eyebrow,
  heading,
  subheading,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
  imageMobileUrl,
  imageMobileAlt,
  className,
}: HeroParallaxProps) {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = React.useRef<HTMLElement | null>(null);

  return (
    <section
      ref={sectionRef}
      className={cn("relative isolate flex h-[100svh] min-h-[620px] w-full flex-col justify-end overflow-hidden", className)}
    >
      <ParallaxImageLayer
        containerRef={sectionRef}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        imageMobileUrl={imageMobileUrl}
        imageMobileAlt={imageMobileAlt}
      />
      {/* Legibility scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-6 pb-24 text-center sm:gap-6 sm:pb-32">
        {eyebrow ? (
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs font-semibold uppercase tracking-[0.25em] text-primary sm:text-sm"
          >
            {eyebrow}
          </motion.span>
        ) : null}

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl font-medium leading-[1.05] text-white sm:text-6xl md:text-7xl"
        >
          {heading}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl text-sm text-white/85 sm:text-lg"
        >
          {subheading}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Button asChild size="lg" className="mt-2 h-11 rounded-full px-6 text-base sm:h-12 sm:px-8">
            <Link href={ctaHref}>
              {ctaLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white/70"
        animate={prefersReducedMotion ? undefined : { y: [0, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.3em]">Scroll</span>
        <ArrowDown className="size-4" aria-hidden="true" />
      </motion.div>
    </section>
  );
}
