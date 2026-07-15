import type { ThemeConfig } from "@/types/theme";

/** Jibhi — Step 7.5D. Quiet forest-fog variant of the generic
 * `forestTheme`: adds `overlay.fog` and softer, mistier greens. */
export const jibhiTheme: ThemeConfig = {
  key: "jibhi",
  name: "Jibhi",
  palette: {
    primary: "#4c8a5a",
    secondary: "#7a8f6a",
    accent: "#b9d6a8",
    background: "#f0f5ec",
    surface: "#ffffff",
    foreground: "#101c12",
    gradients: {
      hero: { angle: 155, stops: [{ color: "#d8e8cc", stop: 0 }, { color: "#7fb088", stop: 55 }, { color: "#345c3f", stop: 100 }] },
      section: { angle: 180, stops: [{ color: "#ffffff", stop: 0 }, { color: "#f0f5ec", stop: 100 }] },
      cta: { angle: 120, stops: [{ color: "#7a8f6a", stop: 0 }, { color: "#4c8a5a", stop: 100 }] },
    },
  },
  typographyMood: "earthy",
  border: { style: "soft", radius: "0.625rem" },
  shadow: { style: "soft" },
  glass: { intensity: 0.18 },
  button: { style: "solid" },
  card: { style: "elevated" },
  section: { background: "surface" },
  hero: { background: "gradient" },
  particle: { type: "leaves", density: 30, speed: 13, color: "#b9d6a8" },
  overlay: { fog: true, waves: false, frost: false },
  motifs: {
    illustrationSet: "forest",
    placements: [
      { asset: "leaf", x: "6%", y: "18%", size: 54, opacity: 0.2, rotate: 24 },
      { asset: "bird", x: "80%", y: "14%", size: 42, opacity: 0.18 },
      { asset: "mountain", x: "0%", y: "76%", size: 200, opacity: 0.1 },
    ],
    decorativePattern: "leaf-scatter",
    patternOpacity: 0.06,
  },
  animation: { preset: "fog-drift" },
  divider: { shape: "forest" },
  navigation: { style: "transparent" },
  footer: { style: "illustrated" },
  cta: { style: "gradient" },
  icon: { style: "duotone" },
  imageOverlay: { style: "gradient-bottom" },
  darkMode: {
    mode: "dedicated",
    background: "#0c150d",
    surface: "#162117",
    primary: "#7fb088",
    secondary: "#7a8f6a",
    particleColor: "#d8e8cc",
  },
};
