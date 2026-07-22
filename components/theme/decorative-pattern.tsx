import { cn } from "@/lib/utils";
import type { ThemeMotifConfig } from "@/types/theme";

export interface DecorativePatternProps {
  config: ThemeMotifConfig;
  className?: string;
}

/** Static asset registry — pattern key → tileable SVG mask, same pattern as decorative-motif.tsx. */
const PATTERN_ASSET: Record<string, string> = {
  "hawa-mahal-lattice": "/illustrations/patterns/hawa-mahal-lattice.svg",
  "frost-lattice": "/illustrations/patterns/frost-lattice.svg",
  "wave-lines": "/illustrations/patterns/wave-lines.svg",
  "leaf-scatter": "/illustrations/patterns/leaf-scatter.svg",
  "sand-dune": "/illustrations/patterns/sand-dune.svg",
  "cloud-drift": "/illustrations/patterns/cloud-drift.svg",
  "star-scatter": "/illustrations/patterns/star-scatter.svg",
  "ripple-lines": "/illustrations/patterns/ripple-lines.svg",
};

/**
 * DecorativePattern — a repeating background texture, tinted with the
 * theme's accent color via CSS `mask-image` so a single greyscale SVG
 * serves every theme; only the color (from `--ub-theme-accent`) changes.
 * Config-driven only: `decorativePattern: "none"` renders nothing.
 */
export function DecorativePattern({ config, className }: DecorativePatternProps) {
  const src = PATTERN_ASSET[config.decorativePattern];
  if (!src || config.patternOpacity <= 0) return null;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        opacity: config.patternOpacity,
        backgroundColor: "var(--ub-theme-accent)",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "repeat",
        maskRepeat: "repeat",
        WebkitMaskSize: "160px 160px",
        maskSize: "160px 160px",
      }}
    />
  );
}
