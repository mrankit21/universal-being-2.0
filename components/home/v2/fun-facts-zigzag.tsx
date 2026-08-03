"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Globe, Sparkles, MapPin, Info, Mountain, Sun, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/** Selectable icon set for admin-authored fun facts — deliberately a small,
 * curated list (rather than exposing every Lucide icon) so the admin
 * Select stays simple. Add more here if a new fact needs a different mark. */
export const FUN_FACT_ICONS: Record<string, LucideIcon> = {
  Globe,
  Sparkles,
  MapPin,
  Info,
  Mountain,
  Sun,
};
export type FunFactIconName = keyof typeof FUN_FACT_ICONS;
export const FUN_FACT_ICON_NAMES = Object.keys(FUN_FACT_ICONS) as FunFactIconName[];

export interface FunFactCardData {
  id: string;
  /** Lucide icon name, looked up in `FUN_FACT_ICONS`. Falls back to Globe
   * when unset or unrecognized. */
  icon?: string;
  title: string;
  body: string;
  learnMoreHref?: string;
}

/**
 * Torn-paper "zigzag" bottom edge, built with a CSS clip-path so no image
 * assets are needed. Matches the reference (visitabudhabi.ae "Did you
 * know" cards): a white card sitting on a solid background color, with a
 * jagged/torn edge along the bottom instead of a straight line.
 */
const ZIGZAG_CLIP_PATH =
  "polygon(0% 0%, 100% 0%, 100% 94%, 95% 100%, 90% 94%, 85% 100%, 80% 94%, 75% 100%, 70% 94%, 65% 100%, 60% 94%, 55% 100%, 50% 94%, 45% 100%, 40% 94%, 35% 100%, 30% 94%, 25% 100%, 20% 94%, 15% 100%, 10% 94%, 5% 100%, 0% 94%)";

/**
 * Homepage UI v2 — "Did you know" style fun-fact carousel, modeled on the
 * visitabudhabi.ae reference screenshots: a torn/zigzag-edge white card
 * over a solid brand-color background, swipeable with prev/next arrow
 * buttons and dot pagination underneath.
 *
 * Static content only, no backend wiring — mirrors the rest of `/new-home`
 * ("abhi backend se connect nahin karna").
 */
export function FunFactsZigzag({
  facts,
  className,
}: {
  facts: FunFactCardData[];
  className?: string;
}) {
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const scrollToIndex = React.useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, track.children.length - 1));
    const child = track.children[clamped] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  // Keep the active dot in sync with manual swipes/drags on the track.
  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    function handleScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!track) return;
        const { scrollLeft, children } = track;
        let closest = 0;
        let closestDist = Infinity;
        Array.from(children).forEach((child, i) => {
          const el = child as HTMLElement;
          const dist = Math.abs(el.offsetLeft - scrollLeft);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });
        setActiveIndex(closest);
      });
    }

    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (facts.length === 0) return null;

  return (
    <section className={cn("relative w-full overflow-hidden bg-ub-teal-600 py-14 sm:py-20", className)}>
      <div className="mx-auto w-full max-w-xl px-4 sm:px-6">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {facts.map((fact, i) => {
            const Icon = (fact.icon && FUN_FACT_ICONS[fact.icon]) || Globe;
            return (
              <motion.div
                key={fact.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="w-full shrink-0 snap-center"
              >
                <div
                  className="flex min-h-[280px] flex-col gap-4 bg-card px-6 pb-10 pt-6 shadow-ub-lg sm:px-8 sm:pt-8"
                  style={{ clipPath: ZIGZAG_CLIP_PATH }}
                >
                  <span className="flex size-11 items-center justify-center rounded-lg bg-ub-teal-600/10 text-ub-teal-600">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-2xl font-bold text-foreground">{fact.title}</h3>
                  <p className="text-base text-muted-foreground">{fact.body}</p>
                  {fact.learnMoreHref ? (
                    <a
                      href={fact.learnMoreHref}
                      className="mt-auto inline-flex w-fit items-center gap-1 text-sm font-bold uppercase tracking-wide text-ub-teal-600 hover:underline"
                    >
                      Learn more
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollToIndex(activeIndex - 1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            {facts.map((fact, i) => (
              <button
                key={fact.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollToIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === activeIndex ? "w-6 bg-primary" : "w-2 bg-white/40"
                )}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollToIndex(activeIndex + 1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
