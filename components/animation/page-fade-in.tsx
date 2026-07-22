"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * PageFadeIn — Step 7.5C "Page Transitions", scoped to the homepage only
 * (wraps the children of `app/page.tsx`). A root-level route-transition
 * (e.g. `app/template.tsx`) would wrap every route including `/admin/*`,
 * since RootShell renders every page's children through the same `<main>`
 * — out of scope for a homepage-only motion phase, so this is applied
 * locally instead of touching shared layout files.
 */
export function PageFadeIn({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
