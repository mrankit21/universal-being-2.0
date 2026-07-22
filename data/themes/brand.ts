import type { ThemeConfig } from "@/types/theme";

/**
 * Brand — the neutral default. Used on marketing pages with no featured
 * trip and as the resolver's fallback when a themeKey doesn't match any
 * registered theme (Architecture §4: "falling back to a neutral 'brand'
 * theme when no trip is featured").
 */
export const brandTheme: ThemeConfig = {
  key: "brand",
  name: "Universal Being",
  palette: {
    primary: "#b0873f",
    secondary: "#2b5c56",
    accent: "#c9a15a",
    background: "#f7f6f3",
    surface: "#ffffff",
    foreground: "#1e1b15",
    gradients: {
      hero: { angle: 135, stops: [{ color: "#f7f6f3", stop: 0 }, { color: "#eeece5", stop: 100 }] },
      section: { angle: 180, stops: [{ color: "#ffffff", stop: 0 }, { color: "#f7f6f3", stop: 100 }] },
      cta: { angle: 120, stops: [{ color: "#b0873f", stop: 0 }, { color: "#8e6b2e", stop: 100 }] },
    },
  },
  typographyMood: "warm",
  border: { style: "soft", radius: "0.625rem" },
  shadow: { style: "soft" },
  glass: { intensity: 0.12 },
  button: { style: "solid" },
  card: { style: "elevated" },
  section: { background: "surface" },
  hero: { background: "gradient" },
  particle: { type: "none", density: 0, speed: 0, color: "#c9a15a" },
  overlay: { fog: false, waves: false, frost: false },
  motifs: {
    illustrationSet: "none",
    placements: [],
    decorativePattern: "none",
    patternOpacity: 0,
  },
  divider: { shape: "none" },
  animation: { preset: "none" },
  navigation: { style: "solid" },
  footer: { style: "minimal" },
  cta: { style: "solid" },
  icon: { style: "line" },
  imageOverlay: { style: "gradient-bottom" },
  darkMode: { mode: "auto" },
};
