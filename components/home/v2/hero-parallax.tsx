"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { ParallaxImageLayer } from "@/components/animation/parallax-image-layer";
import { cn } from "@/lib/utils";

export interface HeroParallaxImage {
  imageUrl: string;
  imageAlt: string;
}

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
  /** Extra photos beyond the primary `imageUrl`/`imageAlt`. When non-empty,
   * the hero becomes a swipeable gallery — primary image first, then these,
   * in order — with dot indicators and left/right arrows, same "slide
   * down" transition as Trip 2.0's hero gallery
   * (`components/trip/v2/trip-hero-v2.tsx`). Omit/leave empty for the
   * original single-photo hero. */
  images?: HeroParallaxImage[];
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
 *
 * Revision (2026-08, multi-image): optionally cycles through several
 * photos (`images`, from the "Additional Hero Images" admin field) on
 * tap/swipe/arrow/dot, same slide-down `AnimatePresence` transition and
 * gallery controls as Trip 2.0's hero (`TripHeroV2`). `images` empty ⇒
 * renders exactly as the single-photo version above, no dots/arrows.
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
  images,
  className,
}: HeroParallaxProps) {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const allImages = React.useMemo<HeroParallaxImage[]>(
    () => [{ imageUrl, imageAlt }, ...(images ?? [])],
    [imageUrl, imageAlt, images]
  );
  const [active, setActive] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const hasGallery = allImages.length > 1;

  function go(delta: number) {
    setActive((prev) => (prev + delta + allImages.length) % allImages.length);
  }

  return (
    <section
      ref={sectionRef}
      className={cn("relative isolate flex h-[100svh] min-h-[620px] w-full flex-col justify-end overflow-hidden", className)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        touchStartX.current = null;
        if (!hasGallery || Math.abs(dx) < 40) return;
        go(dx < 0 ? 1 : -1);
      }}
    >
      {/* Active photo — the primary/only photo when `images` is empty, or
          the current slide of the gallery. Wrapped in AnimatePresence so
          swapping slides slides the incoming photo down from above while
          the outgoing one continues down and out, instead of a hard cut. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={active}
          className="absolute inset-0"
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
        >
          <ParallaxImageLayer
            containerRef={sectionRef}
            imageUrl={allImages[active].imageUrl}
            imageAlt={allImages[active].imageAlt}
            imageMobileUrl={active === 0 ? imageMobileUrl : undefined}
            imageMobileAlt={active === 0 ? imageMobileAlt : undefined}
          />
        </motion.div>
      </AnimatePresence>

      {hasGallery ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <div className="absolute inset-x-0 bottom-24 z-20 flex items-center justify-center gap-1.5 sm:bottom-28">
            {allImages.map((img, i) => (
              <button
                key={img.imageUrl + i}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                onClick={() => setActive(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === active ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </>
      ) : null}

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
