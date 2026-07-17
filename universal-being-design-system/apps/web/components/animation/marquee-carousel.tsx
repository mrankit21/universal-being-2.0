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
 * step-and-pause slider. The track renders the children twice back to back;
 * a `requestAnimationFrame` loop moves it left at a constant speed and wraps
 * the offset every time it crosses one copy's width, so — because both
 * halves are identical — the loop point is invisible and the strip appears
 * to scroll forever.
 *
 * Desktop (mouse): hovering pauses the strip exactly like before — nothing
 * changed there.
 *
 * Touch: the same pause-on-touch behavior stays, but a finger down and
 * dragging now *scrubs* the strip left/right instead of just freezing it in
 * place. On a small screen you can miss a card before the strip pauses;
 * this lets you drag back to it immediately instead of waiting for the
 * loop to come around again. Lifting the finger resumes the auto-scroll
 * from wherever the drag left off — no snap-back.
 *
 * Falls back to a static (non-animating, non-draggable) row when the user
 * has "Reduce Motion" enabled at the OS level.
 */
export function MarqueeCarousel({
  children,
  label,
  className,
  durationSeconds = 26,
  gapClassName = "gap-5",
}: MarqueeCarouselProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const halfWidthRef = React.useRef(0);
  const offsetRef = React.useRef(0);
  const pausedRef = React.useRef(false);
  const draggingRef = React.useRef(false);
  const dragAxisRef = React.useRef<"horizontal" | "vertical" | null>(null);
  const dragStartXRef = React.useRef(0);
  const dragStartYRef = React.useRef(0);
  const dragStartOffsetRef = React.useRef(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Measure one copy's width (half the track's full scroll width) so the
  // wrap point and px/sec speed stay correct after layout/resize.
  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      halfWidthRef.current = track.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [children, reducedMotion]);

  React.useEffect(() => {
    if (reducedMotion) return;
    let rafId: number;
    let lastTime: number | null = null;

    function frame(time: number) {
      const track = trackRef.current;
      const half = halfWidthRef.current;
      if (track && half > 0) {
        if (lastTime == null) lastTime = time;
        const dtSeconds = (time - lastTime) / 1000;
        lastTime = time;

        if (!pausedRef.current && !draggingRef.current) {
          offsetRef.current -= (half / durationSeconds) * dtSeconds;
        }

        // Wrap so the offset stays between minus-half and zero — both
        // copies are identical, so crossing that boundary is seamless.
        if (offsetRef.current <= -half) offsetRef.current += half;
        if (offsetRef.current > 0) offsetRef.current -= half;

        track.style.transform = `translateX(${offsetRef.current}px)`;
      } else {
        lastTime = time;
      }
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [durationSeconds, reducedMotion]);

  function startDrag(clientX: number) {
    draggingRef.current = true;
    dragStartXRef.current = clientX;
    dragStartOffsetRef.current = offsetRef.current;
  }

  function moveDrag(clientX: number) {
    if (!draggingRef.current) return;
    offsetRef.current = dragStartOffsetRef.current + (clientX - dragStartXRef.current);
  }

  function endDrag() {
    draggingRef.current = false;
    dragAxisRef.current = null;
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      role="region"
      aria-label={label}
      aria-roledescription="carousel"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      onTouchStart={(e) => {
        pausedRef.current = true;
        if (reducedMotion) return;
        dragAxisRef.current = null;
        dragStartYRef.current = e.touches[0].clientY;
        startDrag(e.touches[0].clientX);
      }}
      onTouchMove={(e) => {
        if (reducedMotion || !draggingRef.current) return;
        const touch = e.touches[0];
        // Decide once, on the first meaningful move, whether this gesture
        // is a horizontal drag (scrub the strip) or a vertical one (let the
        // page scroll normally) — so a finger swiping up/down through the
        // strip isn't hijacked into a sideways drag.
        if (dragAxisRef.current === null) {
          const dx = touch.clientX - dragStartXRef.current;
          const dy = touch.clientY - dragStartYRef.current;
          if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
          dragAxisRef.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
        }
        if (dragAxisRef.current === "horizontal") {
          e.preventDefault();
          moveDrag(touch.clientX);
        }
      }}
      onTouchEnd={() => {
        pausedRef.current = false;
        endDrag();
      }}
      onTouchCancel={() => {
        pausedRef.current = false;
        endDrag();
      }}
      style={{ touchAction: "pan-y" }}
    >
      <div ref={trackRef} className={cn("flex w-max", gapClassName)}>
        <div className={cn("flex shrink-0", gapClassName)}>{children}</div>
        {!reducedMotion && (
          <div className={cn("flex shrink-0", gapClassName)} aria-hidden="true">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
