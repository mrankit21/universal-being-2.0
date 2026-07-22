"use client";

import * as React from "react";
import { motion, useMotionValue, useAnimation, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { ease, duration } from "@/lib/motion-tokens";

export interface CarouselBaseProps {
  children: React.ReactNode[];
  /** aria-label for the carousel region, e.g. "Trip photo gallery". */
  label: string;
  className?: string;
  /** Shows numbered/dot pagination beneath the track. */
  showDots?: boolean;
  /** Shows prev/next arrow controls (auto-hidden on touch-first small screens by default via CSS). */
  showArrows?: boolean;
  onIndexChange?: (index: number) => void;
}

/**
 * CarouselBase — the single swipe-gesture engine underneath TripGallery,
 * the mobile itinerary view, and testimonials. Domain components pass
 * children (image, itinerary day, quote) and get swipe, keyboard, and
 * dot/arrow navigation for free — no domain logic lives here.
 */
export function CarouselBase({
  children,
  label,
  className,
  showDots = true,
  showArrows = true,
  onIndexChange,
}: CarouselBaseProps) {
  const [index, setIndex] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const x = useMotionValue(0);

  const count = children.length;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goTo = React.useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(count - 1, next));
      setIndex(clamped);
      onIndexChange?.(clamped);
      controls.start({
        x: -clamped * containerWidth,
        transition: { duration: duration.base, ease: ease.emphasized },
      });
    },
    [containerWidth, controls, count, onIndexChange]
  );

  function handleDragEnd(_: unknown, info: PanInfo) {
    const threshold = containerWidth * 0.2;
    if (info.offset.x < -threshold) goTo(index + 1);
    else if (info.offset.x > threshold) goTo(index - 1);
    else goTo(index);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") goTo(index + 1);
    if (e.key === "ArrowLeft") goTo(index - 1);
  }

  return (
    <div
      className={cn("relative", className)}
      role="region"
      aria-label={label}
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
    >
      <div ref={containerRef} className="overflow-hidden">
        <motion.div
          className="flex touch-pan-y"
          drag={containerWidth > 0 ? "x" : false}
          dragConstraints={{ left: -(containerWidth * (count - 1)), right: 0 }}
          dragElastic={0.08}
          style={{ x }}
          animate={controls}
          onDragEnd={handleDragEnd}
        >
          {React.Children.map(children, (child, i) => (
            <div
              className="w-full shrink-0"
              style={{ width: containerWidth || "100%" }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
            >
              {child}
            </div>
          ))}
        </motion.div>
      </div>

      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous slide"
            className={cn(
              "absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center",
              "size-9 rounded-full bg-card/90 text-foreground shadow-ub-md backdrop-blur",
              "disabled:pointer-events-none disabled:opacity-40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "sm:flex"
            )}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === count - 1}
            aria-label="Next slide"
            className={cn(
              "absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center",
              "size-9 rounded-full bg-card/90 text-foreground shadow-ub-md backdrop-blur",
              "disabled:pointer-events-none disabled:opacity-40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "sm:flex"
            )}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </>
      )}

      {showDots && count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label={`${label} pagination`}>
          {children.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-ub-base",
                i === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
