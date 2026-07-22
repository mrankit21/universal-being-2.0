/**
 * Theme Architecture — the ThemeConfig contract (Architecture Blueprint §4).
 *
 * A theme is a DATA OBJECT, never a component tree and never a code branch.
 * Every field a designer might want to tune per destination mood lives here.
 * Components never import a theme by name and never switch on `theme.key`
 * for anything visual — they read the fields below and render accordingly.
 * The only "switches" that exist anywhere in the theme/ component layer are
 * on these field VALUES (e.g. `particle.type === "snow"`), which is generic
 * rendering logic, not a hardcoded theme branch — swap in a new value and
 * the same switch already knows how to draw it.
 *
 * Adding a destination mood = adding one more file in data/themes that
 * satisfies this type. Zero component changes, per the Phase 3 brief.
 */

/** Lowercase-kebab theme keys (Architecture §9 naming convention). */
export type ThemeKey =
  | "brand"
  | "rajasthan"
  | "winter"
  | "monsoon"
  | "beach"
  | "mountain"
  | "forest"
  | "udaipur"
  | "spiti"
  | "manali"
  | "goa"
  | "jibhi";

export type ParticleType =
  | "gold-dust"
  | "snow"
  | "rain"
  | "leaves"
  | "birds"
  | "ice"
  | "lantern-glow"
  | "none";

export type IllustrationSetKey =
  | "camel"
  | "hawa-mahal"
  | "pine"
  | "palm"
  | "mountain"
  | "forest"
  | "palace"
  | "none";

export type DecorativePatternKey =
  | "hawa-mahal-lattice"
  | "frost-lattice"
  | "wave-lines"
  | "leaf-scatter"
  | "sand-dune"
  | "cloud-drift"
  | "star-scatter"
  | "ripple-lines"
  | "none";

/** Step 7.5D — section-divider shape between stacked page sections. Purely
 * presentational, resolved by `SectionDivider` the same generic way every
 * other motif key is resolved: theme supplies the key, the component owns
 * the SVG registry. "none" renders a plain edge (no divider). */
export type DividerShapeKey =
  | "mountains"
  | "desert"
  | "ocean"
  | "forest"
  | "fog"
  | "palace"
  | "none";

export type AnimationPresetKey =
  | "warm-drift"
  | "cold-drift"
  | "rain-fall"
  | "wave-motion"
  | "fog-drift"
  | "leaf-fall"
  | "none";

export type TypographyMood = "warm" | "cool" | "airy" | "earthy" | "crisp";

export type BorderStyleKey = "soft" | "sharp" | "ornate" | "pill" | "none";
export type ShadowStyleKey = "soft" | "crisp" | "glow" | "none";
export type ButtonStyleKey = "solid" | "outline" | "glass" | "pill";
export type CardStyleKey = "flat" | "elevated" | "glass" | "outlined";
export type NavigationStyleKey = "solid" | "transparent" | "glass";
export type FooterStyleKey = "minimal" | "rich" | "illustrated";
export type CtaStyleKey = "solid" | "gradient" | "glass";
export type IconStyleKey = "line" | "duotone" | "filled";
export type ImageOverlayStyleKey = "none" | "gradient-bottom" | "gradient-full" | "color-wash";

/** A single stop in a CSS linear-gradient. */
export interface GradientStop {
  color: string;
  /** 0–100, percentage along the gradient axis. */
  stop: number;
}

export interface ThemeGradient {
  /** Degrees, matches CSS `linear-gradient(<angle>deg, ...)`. */
  angle: number;
  stops: GradientStop[];
}

/** Placement of a single decorative illustration within its container. */
export interface MotifPlacement {
  /** Asset key resolved against the static registry in decorative-motif.tsx. */
  asset: string;
  x: string;
  y: string;
  /** px, longest edge of the illustration. */
  size: number;
  opacity: number;
  /** Degrees, static rotation (never animated — motifs are ambient, not moving). */
  rotate?: number;
}

export interface ThemePalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  foreground: string;
  gradients: {
    hero: ThemeGradient;
    section: ThemeGradient;
    cta: ThemeGradient;
  };
}

export interface ThemeParticleConfig {
  type: ParticleType;
  /** Target particle count at desktop viewport width; halved on mobile automatically. */
  density: number;
  /** Seconds for one full fall/drift cycle — lower is faster. */
  speed: number;
  color: string;
}

export interface ThemeOverlayConfig {
  fog: boolean;
  waves: boolean;
  frost: boolean;
}

export interface ThemeMotifConfig {
  illustrationSet: IllustrationSetKey;
  placements: MotifPlacement[];
  decorativePattern: DecorativePatternKey;
  /** 0–1, opacity applied to the tinted pattern layer. */
  patternOpacity: number;
}

export interface ThemeDarkVariant {
  /** "dedicated" = explicit palette below; "auto" = derived via CSS filter; "none" = theme has no dark mode. */
  mode: "dedicated" | "auto" | "none";
  background?: string;
  surface?: string;
  primary?: string;
  secondary?: string;
  particleColor?: string;
}

export interface ThemeConfig {
  key: ThemeKey;
  name: string;
  palette: ThemePalette;
  typographyMood: TypographyMood;
  border: { style: BorderStyleKey; radius: string };
  shadow: { style: ShadowStyleKey };
  glass: { intensity: number };
  button: { style: ButtonStyleKey };
  card: { style: CardStyleKey };
  section: { background: string };
  hero: { background: string };
  particle: ThemeParticleConfig;
  overlay: ThemeOverlayConfig;
  motifs: ThemeMotifConfig;
  /** Step 7.5D — which SectionDivider SVG shape this destination's page
   * sections blend with. Admin-editable per the same "one field, no
   * component change" rule as every other theme field. */
  divider: { shape: DividerShapeKey };
  animation: { preset: AnimationPresetKey };
  navigation: { style: NavigationStyleKey };
  footer: { style: FooterStyleKey };
  cta: { style: CtaStyleKey };
  icon: { style: IconStyleKey };
  imageOverlay: { style: ImageOverlayStyleKey };
  darkMode: ThemeDarkVariant;
}
