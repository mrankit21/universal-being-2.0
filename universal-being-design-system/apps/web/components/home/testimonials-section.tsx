"use client";

import * as React from "react";
import Image from "next/image";
import { Quote } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useTheme } from "@/hooks/use-theme";
import type { Testimonial } from "@/data/home/testimonials";
import { ThemeBackground } from "@/components/theme/theme-background";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Rating } from "@/components/primitives/rating";
import { Card, CardContent } from "@/components/ui/card";
import { ease, duration } from "@/lib/motion-tokens";
import type { ResolvedSectionBackground } from "@/lib/api/home";

const AUTOPLAY_MS = 5500;

/**
 * TestimonialsSection — Step 7.5B "Testimonials". Rebuilt as its own small
 * auto-advancing, pause-on-hover slider (rather than `CarouselBase`, which
 * doesn't loop past the last slide or expose autoplay) — everything else
 * about `CarouselBase` and its other consumers (TripGallery, mobile
 * itinerary, FeaturedTripsSection's mobile view) is untouched.
 */
export function TestimonialsSection({
  testimonials,
  background,
}: {
  testimonials: Testimonial[];
  background?: ResolvedSectionBackground;
}) {
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = testimonials.length;
  const hasImage = Boolean(background?.backgroundImage);

  React.useEffect(() => {
    if (paused || prefersReducedMotion || count === 0) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, prefersReducedMotion, count]);

  if (count === 0) return null;

  const t = testimonials[index % count];
  const initials = t.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  const content = (
    <div className="relative mx-auto max-w-3xl px-6 py-section-sm sm:py-section-md">
        <SectionHeading
          eyebrow="From past travelers"
          title="What the group chat says afterward"
          align="center"
          className={
            hasImage
              ? "mx-auto mb-8 max-w-2xl [&_h2]:text-white [&_p]:text-white/85 [&_span]:text-ub-brass-300"
              : "mx-auto mb-8 max-w-2xl"
          }
        />

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: duration.slow, ease: ease.emphasized }}
            >
              <Card className="ub-glass border-none">
                <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                  <Quote className="size-6 text-ub-brass-500" aria-hidden="true" />
                  <p className="text-balance font-display text-lg font-medium text-foreground sm:text-xl">
                    “{t.quote}”
                  </p>
                  <Rating value={t.rating} showValue={false} />
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex size-10 items-center justify-center rounded-full bg-ub-brass-500/15 text-sm font-medium text-ub-brass-700">
                      {initials}
                    </span>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{t.name}</span>
                      {t.trip ? ` · ${t.trip}` : ""}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Testimonials">
            {testimonials.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show testimonial from ${item.name}`}
                onClick={() => setIndex(i)}
                className={
                  i === index
                    ? "h-1.5 w-5 rounded-full bg-primary transition-all duration-ub-base"
                    : "h-1.5 w-1.5 rounded-full bg-muted-foreground/30 transition-all duration-ub-base"
                }
              />
            ))}
          </div>
        </div>
    </div>
  );

  if (hasImage && background?.backgroundImage) {
    return (
      <div className="relative isolate overflow-hidden border-y border-border">
        <Image
          src={background.backgroundImage.url}
          alt={background.backgroundImage.alt}
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover"
          unoptimized
        />
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: background.overlayOpacity }}
          aria-hidden="true"
        />
        {content}
      </div>
    );
  }

  return (
    <ThemeBackground theme={theme} area="section" className="ub-section-light border-y border-border">
      {content}
    </ThemeBackground>
  );
}
