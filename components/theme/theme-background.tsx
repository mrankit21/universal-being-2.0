import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { ThemeConfig } from "@/types/theme";
import { ParticleField } from "./particle-field";
import { SeasonalOverlay } from "./seasonal-overlay";
import { DecorativeMotif } from "./decorative-motif";
import { DecorativePattern } from "./decorative-pattern";

export interface ThemeBackgroundProps {
  /** Explicit theme, or omit to read from context via a parent ThemeProvider (pass down as prop to keep this component itself server-renderable). */
  theme: ThemeConfig;
  /** Which gradient slot to paint — hero banners vs. regular section bands. */
  area?: "hero" | "section";
  className?: string;
  children?: ReactNode;
}

/**
 * ThemeBackground — Architecture §4 theme/ layer: "ThemeBackground
 * (gradient/particles/illustration layer)". This is the ONLY component
 * domain code (TripHero, homepage sections, etc.) needs to reach for to
 * get a fully theme-correct backdrop — it composes every other theme/
 * component internally so callers never assemble particles + overlay +
 * motifs by hand, and never see a themeKey.
 */
export function ThemeBackground({ theme, area = "section", className, children }: ThemeBackgroundProps) {
  const gradientVar = area === "hero" ? "var(--ub-theme-gradient-hero)" : "var(--ub-theme-gradient-section)";

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ backgroundImage: gradientVar }}
    >
      <DecorativePattern config={theme.motifs} />
      <DecorativeMotif config={theme.motifs} />
      <SeasonalOverlay config={theme.overlay} />
      <ParticleField config={theme.particle} />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
