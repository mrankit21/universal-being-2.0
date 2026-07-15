"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * FloatingElements — Step 7.5C ambient decoration. Generic blurred orbs
 * (not theme-specific cloud/leaf/bird artwork — those live in the Theme
 * Engine's motif system, which this phase was told not to touch), slowly
 * bobbing to make otherwise-static sections feel alive. Pure decoration:
 * `aria-hidden`, `pointer-events-none`, absolutely positioned so it never
 * affects layout/flow of the section it's dropped into.
 */
export function FloatingElements({ className = "" }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;

  const shapes = [
    { size: 180, top: "8%", left: "6%", duration: 9, delay: 0, blur: "blur-3xl", opacity: "opacity-[0.12]" },
    { size: 140, top: "60%", left: "88%", duration: 8, delay: 1.2, blur: "blur-2xl", opacity: "opacity-[0.10]" },
    { size: 100, top: "80%", left: "18%", duration: 10, delay: 0.6, blur: "blur-2xl", opacity: "opacity-[0.08]" },
  ];

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {shapes.map((s, i) => (
        <motion.span
          key={i}
          className={`absolute rounded-full bg-current ${s.blur} ${s.opacity}`}
          style={{ width: s.size, height: s.size, top: s.top, left: s.left }}
          animate={{ y: [0, -18, 0], x: [0, 6, 0] }}
          transition={{ duration: s.duration, delay: s.delay, ease: "easeInOut", repeat: Infinity }}
        />
      ))}
    </div>
  );
}
