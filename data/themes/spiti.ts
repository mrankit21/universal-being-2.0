import type { ThemeConfig } from "@/types/theme";

/** Spiti — Step 7.5D. High-altitude cold desert at night: deep blue
 * gradients, mountain peaks, star field, ice particles, fog + frost. */
export const spitiTheme: ThemeConfig = {
  key: "spiti",
  name: "Spiti",
  palette: {
    primary: "#2d4f7c",
    secondary: "#6b7ea3",
    accent: "#b7c9e6",
    background: "#e7ecf5",
    surface: "#ffffff",
    foreground: "#0d1524",
    gradients: {
      hero: { angle: 170, stops: [{ color: "#101a33", stop: 0 }, { color: "#2d4f7c", stop: 55 }, { color: "#6b7ea3", stop: 100 }] },
      section: { angle: 180, stops: [{ color: "#ffffff", stop: 0 }, { color: "#e7ecf5", stop: 100 }] },
      cta: { angle: 120, stops: [{ color: "#6b7ea3", stop: 0 }, { color: "#2d4f7c", stop: 100 }] },
    },
  },
  typographyMood: "cool",
  border: { style: "sharp", radius: "0.375rem" },
  shadow: { style: "crisp" },
  glass: { intensity: 0.32 },
  button: { style: "outline" },
  card: { style: "glass" },
  section: { background: "surface" },
  hero: { background: "gradient" },
  particle: { type: "ice", density: 50, speed: 11, color: "#e6f0ff" },
  overlay: { fog: true, waves: false, frost: true },
  motifs: {
    illustrationSet: "mountain",
    placements: [
      { asset: "mountain", x: "0%", y: "68%", size: 260, opacity: 0.2 },
      { asset: "star", x: "18%", y: "10%", size: 26, opacity: 0.3 },
      { asset: "star", x: "62%", y: "6%", size: 20, opacity: 0.26 },
      { asset: "star", x: "80%", y: "16%", size: 24, opacity: 0.28 },
    ],
    decorativePattern: "star-scatter",
    patternOpacity: 0.05,
  },
  animation: { preset: "cold-drift" },
  divider: { shape: "mountains" },
  navigation: { style: "glass" },
  footer: { style: "illustrated" },
  cta: { style: "glass" },
  icon: { style: "line" },
  imageOverlay: { style: "color-wash" },
  darkMode: {
    mode: "dedicated",
    background: "#070b14",
    surface: "#101a2c",
    primary: "#b7c9e6",
    secondary: "#6b7ea3",
    particleColor: "#e6f0ff",
  },
};
