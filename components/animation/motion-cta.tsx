"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { hoverSpring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export interface MotionCtaProps {
  children: React.ReactNode;
  className?: string;
  /** Adds a soft outer glow on hover — reserve for the single primary CTA
   * per section, not every button, or nothing reads as primary anymore. */
  glow?: boolean;
}

/**
 * MotionCta — Step 7.5C button polish, applied by WRAPPING `<Button>`
 * rather than editing `components/ui/button.tsx` directly. That file is the
 * shared primitive used across the entire product, including the Admin
 * Panel — this phase is explicitly scoped to the homepage, so the base
 * Button stays exactly as-is and every admin button is unaffected. Adds:
 * hover lift, click ripple, optional glow, and a soft scale-down on press.
 */
export function MotionCta({ children, glow = false, className }: MotionCtaProps) {
  const prefersReducedMotion = useReducedMotion();
  const [ripples, setRipples] = React.useState<Ripple[]>([]);

  function handlePointerDown(e: React.PointerEvent<HTMLSpanElement>) {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const ripple: Ripple = {
      id: Date.now(),
      x: e.clientX - rect.left - size / 2,
      y: e.clientY - rect.top - size / 2,
      size,
    };
    setRipples((prev) => [...prev, ripple]);
    window.setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 650);
  }

  return (
    <motion.span
      className={cn("relative inline-block overflow-hidden rounded-md align-middle", className)}
      whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.015 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      transition={hoverSpring}
      onPointerDown={handlePointerDown}
      style={
        glow
          ? { filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.16))" }
          : undefined
      }
    >
      {children}

      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="pointer-events-none absolute rounded-full bg-white/40"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
            initial={{ opacity: 0.5, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </motion.span>
  );
}
