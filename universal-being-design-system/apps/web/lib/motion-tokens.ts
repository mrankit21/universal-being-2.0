/**
 * Motion tokens — the JS-side mirror of the CSS custom properties defined in
 * app/globals.css (--ub-duration-*, --ub-ease-*). Framer Motion needs raw
 * numbers/arrays, not CSS var() strings, so this file is the single source
 * of truth for any component using `motion` directly. Keep both files in
 * sync if these values ever change.
 */

export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

export const ease = {
  standard: [0.4, 0, 0.2, 1],
  emphasized: [0.16, 1, 0.3, 1],
} as const;

/** Shared viewport options for scroll-triggered reveals — fires once, a bit
 * before the element is fully in view so motion feels anticipatory, not late. */
export const revealViewport = {
  once: true,
  margin: "0px 0px -80px 0px",
} as const;

/** Standard fade + rise-in, used by RevealOnScroll (Phase 3, animation layer). */
export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.emphasized },
  },
} as const;

/** Stagger container for lists (used sparingly — section-level, not per-card). */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
} as const;

/**
 * Step 7.5C — additional reveal variants, so different sections can use a
 * different entrance instead of every section doing the same fade-up.
 * Same `duration`/`ease` tokens above; only the initial transform differs.
 */
export const fadeInLeft = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: ease.emphasized } },
} as const;

export const fadeInRight = {
  hidden: { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: ease.emphasized } },
} as const;

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: duration.slow, ease: ease.emphasized } },
} as const;

export const tiltIn = {
  hidden: { opacity: 0, y: 20, rotate: -2 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: { duration: duration.slow, ease: ease.emphasized } },
} as const;

/** Gentle, slow, indefinite bob — for ambient floating decorative shapes. Kept
 * small in amplitude so it reads as "alive" rather than distracting. */
export const floatY = {
  animate: {
    y: [0, -14, 0],
    transition: { duration: 7, ease: "easeInOut", repeat: Infinity },
  },
} as const;

/** Spring used for hover-lift / tilt interactions — snappier than the
 * duration/ease tokens above, which are for entrances, not live pointer feedback. */
export const hoverSpring = { type: "spring", stiffness: 300, damping: 22 } as const;
