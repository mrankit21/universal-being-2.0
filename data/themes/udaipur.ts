import type { ThemeConfig } from "@/types/theme";

/**
 * Udaipur — Step 7.5D. A Rajasthan variant per design decision: same warm
 * desert-gold palette family as `rajasthanTheme`, shifted toward a lake-city
 * evening mood (deeper ambers, lantern glow, palace silhouettes, lake
 * ripples via `overlay.waves`) instead of Rajasthan's daytime dune warmth.
 */
export const udaipurTheme: ThemeConfig = {
  key: "udaipur",
  name: "Udaipur",
  palette: {
    primary: "#c9812f",
    secondary: "#7a3b4f",
    accent: "#f0c26a",
    background: "#fbeede",
    surface: "#fff8ec",
    foreground: "#331d12",
    gradients: {
      hero: { angle: 140, stops: [{ color: "#f6d9a0", stop: 0 }, { color: "#c97a4a", stop: 50 }, { color: "#5c2f42", stop: 100 }] },
      section: { angle: 180, stops: [{ color: "#fff8ec", stop: 0 }, { color: "#fbeede", stop: 100 }] },
      cta: { angle: 120, stops: [{ color: "#f0c26a", stop: 0 }, { color: "#c9812f", stop: 100 }] },
    },
  },
  typographyMood: "warm",
  border: { style: "ornate", radius: "0.5rem" },
  shadow: { style: "soft" },
  glass: { intensity: 0.2 },
  button: { style: "solid" },
  card: { style: "elevated" },
  section: { background: "surface" },
  hero: { background: "gradient" },
  particle: { type: "lantern-glow", density: 26, speed: 16, color: "#f0c26a" },
  overlay: { fog: false, waves: true, frost: false },
  motifs: {
    illustrationSet: "palace",
    placements: [
      { asset: "palace-silhouette", x: "6%", y: "58%", size: 210, opacity: 0.16 },
      { asset: "hawa-mahal-arch", x: "84%", y: "8%", size: 150, opacity: 0.1 },
      { asset: "sun", x: "70%", y: "10%", size: 70, opacity: 0.14 },
    ],
    decorativePattern: "ripple-lines",
    patternOpacity: 0.05,
  },
  animation: { preset: "warm-drift" },
  divider: { shape: "palace" },
  navigation: { style: "transparent" },
  footer: { style: "illustrated" },
  cta: { style: "gradient" },
  icon: { style: "duotone" },
  imageOverlay: { style: "gradient-bottom" },
  darkMode: {
    mode: "dedicated",
    background: "#26130a",
    surface: "#361c10",
    primary: "#f0c26a",
    secondary: "#a8607a",
    particleColor: "#f6d9a0",
  },
};
