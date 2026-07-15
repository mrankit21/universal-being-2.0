"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

import { revealViewport, fadeInUp, fadeInLeft, fadeInRight, scaleIn, tiltIn, duration, ease } from "@/lib/motion-tokens";

const variantMap = {
  up: fadeInUp,
  left: fadeInLeft,
  right: fadeInRight,
  scale: scaleIn,
  tilt: tiltIn,
} satisfies Record<string, Variants>;

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Which entrance style to use — lets different sections read differently
   * instead of every section doing the same fade-up (Step 7.5C ask). */
  variant?: keyof typeof variantMap;
  delay?: number;
  as?: "div" | "li";
}

/**
 * Reveal — Step 7.5C scroll-reveal primitive. Thin wrapper so each section
 * can pick a different entrance (`up` / `left` / `right` / `scale` / `tilt`)
 * without every section hand-rolling its own `motion.div` + viewport props.
 * Respects `prefers-reduced-motion` (just fades opacity, no transform).
 */
export function Reveal({ variant = "up", delay = 0, as = "div", className, children }: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const base = variantMap[variant];
  const variants: Variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: base.hidden,
        visible: { ...base.visible, transition: { duration: duration.slow, ease: ease.emphasized, delay } },
      };

  const Comp = motion[as];
  return (
    <Comp className={className} variants={variants} initial="hidden" whileInView="visible" viewport={revealViewport}>
      {children}
    </Comp>
  );
}
