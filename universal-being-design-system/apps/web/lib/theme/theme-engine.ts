import type { ThemeConfig, ThemeGradient } from "@/types/theme";

/**
 * Theme Engine — converts a ThemeConfig into the flat CSS custom-property
 * map that actually paints the page. This file is the ONLY place that knows
 * how a ThemeConfig field maps to a CSS variable name; every component just
 * reads the resulting `var(--ub-theme-*)` (or the redefined shadcn
 * semantic vars) — nothing here is theme-name-specific, it's shape-generic
 * over any ThemeConfig that satisfies the type.
 */

export function gradientToCss(gradient: ThemeGradient): string {
  const stops = gradient.stops.map((s) => `${s.color} ${s.stop}%`).join(", ");
  return `linear-gradient(${gradient.angle}deg, ${stops})`;
}

/**
 * buildThemeCssVars — flat variable map for inline-style injection (used by
 * ThemeProvider as a belt-and-suspenders alternative/complement to the
 * static `[data-theme]` blocks in styles/themes.css). Kept pure so it can
 * run identically on server and client without any risk of drift.
 */
export function buildThemeCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--ub-theme-primary": theme.palette.primary,
    "--ub-theme-secondary": theme.palette.secondary,
    "--ub-theme-accent": theme.palette.accent,
    "--ub-theme-background": theme.palette.background,
    "--ub-theme-surface": theme.palette.surface,
    "--ub-theme-foreground": theme.palette.foreground,
    "--ub-theme-gradient-hero": gradientToCss(theme.palette.gradients.hero),
    "--ub-theme-gradient-section": gradientToCss(theme.palette.gradients.section),
    "--ub-theme-gradient-cta": gradientToCss(theme.palette.gradients.cta),
    "--ub-theme-radius": theme.border.radius,
    "--ub-theme-glass-intensity": String(theme.glass.intensity),
    "--ub-theme-particle-color": theme.particle.color,
    "--ub-theme-particle-density": String(theme.particle.density),
    "--ub-theme-particle-speed": `${theme.particle.speed}s`,
    "--ub-theme-pattern-opacity": String(theme.motifs.patternOpacity),
  };
}

/**
 * getResponsiveDensity — mobile devices get a lighter particle load to
 * protect scroll performance and battery (Phase 3 performance requirement:
 * "Automatically reduce particle density on mobile devices"). Pure/testable:
 * takes a viewport width instead of reading `window` itself.
 */
export function getResponsiveDensity(baseDensity: number, viewportWidth: number): number {
  if (viewportWidth < 480) return Math.round(baseDensity * 0.35);
  if (viewportWidth < 768) return Math.round(baseDensity * 0.55);
  return baseDensity;
}
