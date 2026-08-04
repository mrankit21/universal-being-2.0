"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { ParallaxImageLayer } from "@/components/animation/parallax-image-layer";
import { cn } from "@/lib/utils";

export interface TripHeroImageV2 {
  imageUrl: string;
  imageAlt: string;
}

export interface TripHeroV2Props {
  bookHref: string;
  imageUrl: string;
  imageAlt: string;
  /** Extra photos beyond the primary `imageUrl`/`imageAlt`. When non-empty,
   * the hero becomes a swipeable gallery — primary image first, then these,
   * in order — with dot indicators and left/right arrows. Omit/leave empty
   * for the original single-photo hero. */
  images?: TripHeroImageV2[];
  /** Small uppercase label above the heading (e.g. the trip's location).
   * Same slot as `HeroParallax`'s `eyebrow` on Homepage 2.0. Omit to hide. */
  eyebrow?: string;
  /** Large serif headline over the hero photo — same text template as
   * Homepage 2.0's hero (`components/home/v2/hero-parallax.tsx`), typically
   * the trip's title. Omit to keep the original image-only hero. */
  heading?: string;
  /** Short supporting line under the heading, same styling as Homepage
   * 2.0's hero subheading — typically the trip's short description. */
  subheading?: string;
}

/**
 * Trip 2.0 UI — hero section. Same scroll-linked parallax technique as
 * `components/home/v2/hero-parallax.tsx` (see `ParallaxImageLayer`'s doc
 * comment for why it's a Framer Motion transform instead of `bg-fixed`).
 *
 * Simplified per serial-order revision (2026-07): image only, no title/
 * description overlay — that content now lives in its own block
 * (`TripTitleV2`) directly below, so it never gets swallowed by the hero
 * gradient on smaller screens. Keeps the floating "Book Now" pill from
 * the reference screenshot.
 *
 * Revision (2026-08): dropped the search+menu pill from the floating
 * control row — those actions already live in the site header, so the
 * hero now surfaces only the "Book Now" pill. Also swapped `bg-fixed` for
 * `ParallaxImageLayer`, matching the visitabudhabi.ae-style "almost
 * fixed, slight drift" background used on Homepage 2.0's hero.
 *
 * Revision (2026-08, multi-image): hero now optionally cycles through
 * several photos (`images`) instead of always showing one still. Each
 * photo still renders through `ParallaxImageLayer` (so the sticky+fade
 * scroll behaviour is identical for every slide) — only the *active*
 * image mounts, swapped on tap/swipe/arrow click, so there's no layout
 * cost for a single-image hero (`images` empty ⇒ renders exactly as
 * before, no dots/arrows).
 *
 * Revision (2026-08, text template): brought back an optional text
 * overlay (`eyebrow`/`heading`/`subheading`) using the exact same
 * template as Homepage 2.0's hero (`HeroParallax`) — same eyebrow/serif-
 * heading/subheading treatment and matching legibility scrim. Unlike that
 * component, the CTA stays the existing "Book Now" pill rather than an
 * "Explore Trips" button. All three props are optional so a hero with
 * none of them set still renders exactly as the image-only version above.
 *
 * Revision (2026-08, slide transition): gallery slides no longer hard-cut
 * when swapping (tap/swipe/arrow/dot). The active photo is wrapped in an
 * `AnimatePresence`, keyed by index — the incoming photo drops in from
 * above (y: -100% -> 0) while the outgoing one continues down and out
 * (y: 0 -> 100%), layered inside the section's existing
 * `overflow-hidden`. Single-image heroes are unaffected since there's
 * never a second key to transition to.
 *
 * Revision (2026-08, autoplay): gallery slides now auto-advance every 2s
 * on their own (same slide transition as manual swipe/arrow/dot), pausing
 * while the tab is in the background and disabled entirely under
 * `prefers-reduced-motion`. Manual interaction still works as before and
 * simply restarts the 2s countdown from whatever slide it lands on.
 */
export function TripHeroV2({ bookHref, imageUrl, imageAlt, images, eyebrow, heading, subheading }: TripHeroV2Props) {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const allImages = React.useMemo<TripHeroImageV2[]>(
    () => [{ imageUrl, imageAlt }, ...(images ?? [])],
    [imageUrl, imageAlt, images]
  );
  const [active, setActive] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const hasGallery = allImages.length > 1;
  const hasText = Boolean(eyebrow || heading || subheading);
  const prefersReducedMotion = useReducedMotion();

  function go(delta: number) {
    setActive((prev) => (prev + delta + allImages.length) % allImages.length);
  }

  // Auto-advance every 2s once there's a gallery, pausing while the tab is
  // hidden and skipping entirely under prefers-reduced-motion. Any manual
  // interaction (arrow/dot/swipe) resets this same interval via the
  // `active` dependency, so autoplay doesn't fight a tap right after it.
  React.useEffect(() => {
    if (!hasGallery || prefersReducedMotion) return;
    const id = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      go(1);
    }, 2000);
    return () => clearInterval(id);
  }, [hasGallery, prefersReducedMotion, active, allImages.length]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex h-[100svh] min-h-[620px] w-full flex-col justify-end overflow-hidden"
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
          />
        </motion.div>
      </AnimatePresence>
      <div
        className={cn(
          "absolute inset-0",
          hasText ? "bg-gradient-to-t from-black/85 via-black/30 to-black/40" : "bg-gradient-to-t from-black/60 via-black/10 to-transparent"
        )}
        aria-hidden="true"
      />

      {hasText ? (
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-6 pb-28 text-center sm:gap-6 sm:pb-32">
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

          {heading ? (
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl font-medium leading-[1.05] text-white sm:text-6xl md:text-7xl"
            >
              {heading}
            </motion.h1>
          ) : null}

          {subheading ? (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl text-sm text-white/85 sm:text-lg"
            >
              {subheading}
            </motion.p>
          ) : null}
        </div>
      ) : null}

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

      {/* Floating control row: just the Book Now pill (search+menu pill removed per revision) */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center px-4 sm:bottom-8">
        <Link
          href={bookHref}
          className={cn(
            "flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-ub-xl",
            "transition-colors hover:bg-primary/90 sm:px-6"
          )}
        >
          <CalendarCheck className="size-4" aria-hidden="true" />
          Book Now
        </Link>
      </div>
    </section>
  );
}
