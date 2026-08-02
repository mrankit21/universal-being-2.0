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
  /** Opacity the image fades DOWN to by the time the section has fully
   * scrolled past (progress = 1). 1 = no fade. Defaults to 0.35, matching
   * the reference: the image stays visibly present, just dimmed, never
   * fully disappearing before the next section takes over. */
  fadeToOpacity?: number;
}

/**
 * Cinematic hero background layer — destination photo stays pinned in
 * place for the entire time its section is in view, then scrolls away
 * normally once the section itself scrolls past, fading out as it goes.
 *
 * Revision (2026-08): switched from a transform-based "slight drift"
 * parallax to `position: sticky`. Sticky pins the image to the top of the
 * viewport for as long as its section occupies the viewport — a true
 * "fixed" look — without the iOS Safari flakiness of
 * `background-attachment: fixed` (sticky is well-supported everywhere,
 * since it's resolved by normal layout/scroll, not a separate compositing
 * path). No oversize/overscan hack needed either, since the image never
 * translates on its own; it just sticks, then leaves with its section.
 * Opacity is the only animated property, driven by the section's own
 * scroll progress (`useScroll` + `useTransform`), so it's a single
 * GPU-cheap property change.
 *
 * Usage: give the *section* a `ref` and pass it as `containerRef`; this
 * component fills that section (`inset-0`) as its first child, behind the
 * section's own gradient scrim and foreground content. The section must
 * NOT have `overflow-hidden` removed elsewhere in a way that clips this
 * before it can stick — the existing hero sections are fine as-is.
 */
export function ParallaxImageLayer({
  containerRef,
  imageUrl,
  imageAlt,
  imageMobileUrl,
  imageMobileAlt,
  fadeToOpacity = 0.35,
}: ParallaxImageLayerProps & { containerRef: React.RefObject<HTMLElement | null> }) {
  const prefersReducedMotion = useReducedMotion();

  // Progress across exactly this section's own scroll distance (0 as its
  // top hits the viewport top, 1 as its bottom hits the viewport top) —
  // not the whole page — so the fade is scoped to while the section is
  // actually the one leaving the screen.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const rawOpacity = useTransform(scrollYProgress, [0, 1], [1, fadeToOpacity]);
  const opacity = prefersReducedMotion ? 1 : rawOpacity;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden={false}>
      <motion.div style={{ opacity }} className="sticky top-0 h-full w-full will-change-[opacity]">
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