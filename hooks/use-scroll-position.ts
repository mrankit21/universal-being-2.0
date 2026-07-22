"use client";

import * as React from "react";

export interface ScrollPositionState {
  /** Current scrollY, throttled to animation frames. */
  y: number;
  /** True once scrolled past `shrinkAt`. */
  isScrolled: boolean;
  /** "up" | "down" | null (null until the first scroll event fires). */
  direction: "up" | "down" | null;
}

/**
 * useScrollPosition — single rAF-throttled scroll listener shared by
 * DesktopHeader (shrink-on-scroll) and BottomNav (hide-on-scroll-down).
 * Passive listener + rAF throttling keeps this off the main-thread hot
 * path — no layout thrash, nothing here reads layout properties.
 *
 * Returns `{ y: 0, isScrolled: false, direction: null }` on the server and
 * on first client render, so SSR and the first paint always agree — no
 * hydration mismatch.
 */
export function useScrollPosition(shrinkAt = 24): ScrollPositionState {
  const [state, setState] = React.useState<ScrollPositionState>({
    y: 0,
    isScrolled: false,
    direction: null,
  });

  React.useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      setState({
        y,
        isScrolled: y > shrinkAt,
        direction: y === lastY ? null : y > lastY ? "down" : "up",
      });
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    // Sync initial state on mount (covers a page loaded already scrolled).
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [shrinkAt]);

  return state;
}
