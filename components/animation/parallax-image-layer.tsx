"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export interface ParallaxImageLayerProps {
  /** Background shown on tablet/desktop (≥768px). */
  imageUrl: string;
  imageAlt: string;
  /** Optional separate crop for phone viewports (<768px) — falls back to
   * `imageUrl`/`imageAlt` when unset. */
  imageMobileUrl?: string;
  imageMobileAlt?: string;
  /** How far the image drifts relative to the section's own scroll
   * distance, as a fraction of the image layer's height. 0.16 means the
   * photo moves at ~16% of the page's scroll speed — "almost fixed" with
   * just enough drift to read as depth, not a sudden jump. */
  strength?: number;
}

/**
 * Cinematic hero background layer — the visitabudhabi.ae-style effect
 * where the destination photo stays nearly still while everything else
 * (headline, cards, sections) scrolls normally over it.
 *
 * Deliberately NOT `background-attachment: fixed`. That CSS trick pins the
 * image to the *viewport*, which is cheap but historically flaky on iOS
 * Safari inside scroll containers and gives an all-or-nothing "glued to
 * screen" look rather than the reference's *slight* drift. Instead this
 * measures the section's own scroll progress (`useScroll` with
 * `target: sectionRef`) and translates a slightly oversized image layer by
 * a small fraction of that (`useTransform`) — a transform-based parallax
 * that's GPU-composited (translateY only, no layout thrash) and works
 * identically across browsers.
 *
 * Usage: give the *section* a `ref` and pass it as `containerRef`; this
 * component fills that section absolutely (`inset-0`) as its first child,
 * behind the section's own gradient scrim and foreground content.
 */
export function ParallaxImageLayer({
  containerRef,
  imageUrl,
  imageAlt,
  imageMobileUrl,
  imageMobileAlt,
  strength = 0.16,
}: ParallaxImageLayerProps & { containerRef: React.RefObject<HTMLElement | null> }) {
  const prefersReducedMotion = useReducedMotion();

  // Progress across exactly this section's own scroll distance (0 as its
  // top hits the viewport top, 1 as its bottom hits the viewport top) —
  // not the whole page — so the drift is scoped to while the section is
  // actually the one on screen.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // The layer is oversized (see className below) so translating it never
  // reveals an edge. Percentages here are relative to the layer's own
  // (oversized) height, so keep `strength` well under the overscan built
  // into that oversize — see the h-[128%] / -16% pairing below.
  const rawY = useTransform(scrollYProgress, [0, 1], ["0%", `-${strength * 100}%`]);
  const y = prefersReducedMotion ? "0%" : rawY;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden={false}>
      <motion.div style={{ y }} className="absolute inset-x-0 top-0 h-[128%] w-full will-change-transform">
        <div
          className="absolute inset-0 hidden bg-cover bg-center md:block"
          style={{ backgroundImage: `url(${imageUrl})` }}
          role="img"
          aria-label={imageAlt}
        />
        <div
          className="absolute inset-0 block bg-cover bg-center md:hidden"
          style={{ backgroundImage: `url(${imageMobileUrl || imageUrl})` }}
          role="img"
          aria-label={imageMobileAlt || imageAlt}
        />
      </motion.div>
    </div>
  );
}
