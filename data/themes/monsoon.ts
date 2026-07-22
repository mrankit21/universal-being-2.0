import type { ThemeConfig } from "@/types/theme";

/** Monsoon — rain particles, drifting fog, cloud layers, wet-reflection overlays. */
export const monsoonTheme: ThemeConfig = {
  key: "monsoon",
  name: "Monsoon",
  palette: {
    primary: "#4b6b63",
    secondary: "#6f7d8c",
    accent: "#8fae9f",
    background: "#eef1ee",
    surface: "#f6f8f6",
    foreground: "#1a211d",
    gradients: {
      hero: { angle: 170, stops: [{ color: "#c7d1cb", stop: 0 }, { color: "#7c8f87", stop: 55 }, { color: "#3f4d47", stop: 100 }] },
      section: { angle: 180, stops: [{ color: "#f6f8f6", stop: 0 }, { color: "#eef1ee", stop: 100 }] },
      cta: { angle: 120, stops: [{ color: "#6f7d8c", stop: 0 }, { color: "#4b6b63", stop: 100 }] },
    },
  },
  typographyMood: "cool",
  border: { style: "soft", radius: "0.75rem" },
  shadow: { style: "soft" },
  glass: { intensity: 0.24 },
  button: { style: "outline" },
  card: { style: "outlined" },
  section: { background: "surface" },
  hero: { background: "gradient" },
  particle: { type: "rain", density: 70, speed: 3, color: "#c7d1cb" },
  overlay: { fog: true, waves: false, frost: false },
  motifs: {
    illustrationSet: "none",
    placements: [
      { asset: "cloud", x: "10%", y: "10%", size: 160, opacity: 0.2 },
      { asset: "cloud", x: "70%", y: "18%", size: 120, opacity: 0.16 },
    ],
    decorativePattern: "cloud-drift",
    patternOpacity: 0.04,
  },
  divider: { shape: "fog" },
  animation: { preset: "rain-fall" },
  navigation: { style: "solid" },
  footer: { style: "minimal" },
  cta: { style: "solid" },
  icon: { style: "line" },
  imageOverlay: { style: "color-wash" },
  darkMode: {
    mode: "dedicated",
    background: "#10140f",
    surface: "#1a201a",
    primary: "#8fae9f",
    secondary: "#6f7d8c",
    particleColor: "#a9b6b0",
  },
};
