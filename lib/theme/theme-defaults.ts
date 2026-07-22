import type { DecorativePatternKey, DividerShapeKey, IllustrationSetKey, ParticleType } from "@/types/theme";

/**
 * Theme-field option catalogs — Step 7.5D "Admin Ready" requirement:
 * "Architecture must support future Admin CMS ... Later, Admin should be
 * able to upload illustrations, change particles, change overlays,
 * enable/disable animations without code changes."
 *
 * This file does NOT change how any destination is themed today — every
 * value here is already sourced from `data/themes/*.ts`. It exists purely
 * as the option list a future Admin form (dropdowns for particle type,
 * divider shape, etc.) will read from, so admin UI work never needs to
 * duplicate or hardcode the enums already defined in `types/theme.ts`.
 */
export const PARTICLE_TYPE_OPTIONS: ParticleType[] = [
  "none",
  "gold-dust",
  "snow",
  "rain",
  "leaves",
  "birds",
  "ice",
  "lantern-glow",
];

export const DIVIDER_SHAPE_OPTIONS: DividerShapeKey[] = [
  "none",
  "mountains",
  "desert",
  "ocean",
  "forest",
  "fog",
  "palace",
];

export const DECORATIVE_PATTERN_OPTIONS: DecorativePatternKey[] = [
  "none",
  "hawa-mahal-lattice",
  "frost-lattice",
  "wave-lines",
  "leaf-scatter",
  "sand-dune",
  "cloud-drift",
  "star-scatter",
  "ripple-lines",
];

export const ILLUSTRATION_SET_OPTIONS: IllustrationSetKey[] = [
  "none",
  "camel",
  "hawa-mahal",
  "pine",
  "palm",
  "mountain",
  "forest",
  "palace",
];

/** Safe fallback values a new/incomplete Admin-authored theme can start
 * from before an editor fills every field in — mirrors `brandTheme`'s
 * "neutral, nothing enabled" posture so a half-configured theme never
 * renders broken or noisy. */
export const THEME_FIELD_DEFAULTS = {
  particle: { type: "none" as ParticleType, density: 0, speed: 0 },
  overlay: { fog: false, waves: false, frost: false },
  divider: { shape: "none" as DividerShapeKey },
  motifs: { illustrationSet: "none" as IllustrationSetKey, decorativePattern: "none" as DecorativePatternKey, patternOpacity: 0 },
};
