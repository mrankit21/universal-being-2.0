import Image from "next/image";

import { cn } from "@/lib/utils";
import type { ThemeMotifConfig } from "@/types/theme";

export interface DecorativeMotifProps {
  config: ThemeMotifConfig;
  className?: string;
}

/**
 * Static asset registry — the ONLY place that maps a motif's `asset` key to
 * an SVG path. Any theme's `placements[].asset` value just needs to exist
 * here; this component never knows or cares which theme requested it.
 */
const MOTIF_ASSET: Record<string, string> = {
  camel: "/illustrations/motifs/camel.svg",
  "hawa-mahal-arch": "/illustrations/motifs/hawa-mahal-arch.svg",
  pine: "/illustrations/motifs/pine.svg",
  snowflake: "/illustrations/motifs/snowflake.svg",
  palm: "/illustrations/motifs/palm.svg",
  cloud: "/illustrations/motifs/cloud.svg",
  sun: "/illustrations/motifs/sun.svg",
  mountain: "/illustrations/motifs/mountain.svg",
  leaf: "/illustrations/motifs/leaf.svg",
  bird: "/illustrations/motifs/bird.svg",
  "palace-silhouette": "/illustrations/motifs/palace-silhouette.svg",
  star: "/illustrations/motifs/star.svg",
};

/**
 * DecorativeMotif — Architecture §4 "motifs: { illustrationSet, position[] }".
 * Purely presentational and 100% data-driven: no illustrationSet value maps
 * to component code, only to asset paths + positions supplied by the theme.
 */
export function DecorativeMotif({ config, className }: DecorativeMotifProps) {
  if (config.illustrationSet === "none" || config.placements.length === 0) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {config.placements.map((p, i) => {
        const src = MOTIF_ASSET[p.asset];
        if (!src) return null;
        return (
          <div
            key={`${p.asset}-${i}`}
            className="absolute"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              transform: p.rotate ? `rotate(${p.rotate}deg)` : undefined,
            }}
          >
            <Image src={src} alt="" fill sizes={`${p.size}px`} className="object-contain" />
          </div>
        );
      })}
    </div>
  );
}
