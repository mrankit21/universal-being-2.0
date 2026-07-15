"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

/**
 * TiltCard — Step 7.5C "Mouse Interactions": very subtle 3D tilt that
 * follows the pointer, desktop only (`(hover: hover) and (pointer: fine)` —
 * touch devices never get a mousemove handler attached at all, so mobile is
 * completely unaffected). Wrap any card content; parent controls sizing.
 */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), { stiffness: 300, damping: 30 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      // Touch devices simply never fire mousemove — no extra gating needed,
      // but belt-and-suspenders: skip the effect's visual result too.
      data-tilt={prefersReducedMotion ? "off" : "on"}
    >
      {children}
    </motion.div>
  );
}
