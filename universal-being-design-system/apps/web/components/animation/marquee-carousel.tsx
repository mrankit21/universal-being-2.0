"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface MarqueeCarouselProps {
  /** Each item — give every item a fixed width (e.g. `w-64`) so the strip's
   * two duplicated copies line up exactly; percentage/flexible widths will
   * make the loop jump instead of scrolling seamlessly. */
  children: React.ReactNode[];
  label: string;
  className?: string;
  /** Seconds for one full loop of the strip. Lower = faster scroll. */
  durationSeconds?: number;
  gapClassName?: string;
}

/**
 * MarqueeCarousel — a continuously-scrolling horizontal strip, not a
 * step-and-pause slider. The track renders the children twice back to back
 * and animates from translateX(0) to translateX(-50%) on a linear, infinite
 * CSS loop — because both halves are identical, the loop point is invisible
 * and the strip appears to scroll forever. Pauses on hover/touch. Falls back
 * to a static (non-animating) row when the user has "Reduce Motion" enabled.
 */
export function MarqueeCarousel({
  children,
  label,
  className,
  durationSeconds = 26,
  gapClassName = "gap-5",
}: MarqueeCarouselProps) {
  const [paused, setPaused] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      role="region"
      aria-label={label}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        className={cn("flex w-max", gapClassName)}
        style={
          reducedMotion
            ? undefined
            : {
                animation: `ub-marquee ${durationSeconds}s linear infinite`,
                animationPlayState: paused ? "paused" : "running",
              }
        }
      >
        <div className={cn("flex shrink-0", gapClassName)}>{children}</div>
        {!reducedMotion && (
          <div className={cn("flex shrink-0", gapClassName)} aria-hidden="true">
            {children}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes ub-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
