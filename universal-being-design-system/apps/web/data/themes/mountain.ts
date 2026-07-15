import type { ThemeConfig } from "@/types/theme";

/** Mountain — hill-station stillness: mountain silhouettes, cloud shadows, morning fog. */
export const mountainTheme: ThemeConfig = {
  key: "mountain",
  name: "Mountain",
  palette: {
    primary: "#5a6b8c",
    secondary: "#8c7256",
    accent: "#a9b8cf",
    background: "#f0f1f5",
    surface: "#ffffff",
    foreground: "#191c26",
    gradients: {
      hero: { angle: 165, stops: [{ color: "#dfe4ee", stop: 0 }, { color: "#9aa8c2", stop: 55 }, { color: "#4b5670", stop: 100 }] },
      section: { angle: 180, stops: [{ color: "#ffffff", stop: 0 }, { color: "#f0f1f5", stop: 100 }] },
      cta: { angle: 120, stops: [{ color: "#8c7256", stop: 0 }, { color: "#6b5640", stop: 100 }] },
    },
  },
  typographyMood: "crisp",
  border: { style: "sharp", radius: "0.5rem" },
  shadow: { style: "crisp" },
  glass: { intensity: 0.16 },
  button: { style: "outline" },
  card: { style: "outlined" },
  section: { background: "surface" },
  hero: { background: "gradient" },
  particle: { type: "none", density: 0, speed: 0, color: "#dfe4ee" },
  overlay: { fog: true, waves: false, frost: false },
  motifs: {
    illustrationSet: "mountain",
    placements: [
      { asset: "mountain", x: "0%", y: "58%", size: 260, opacity: 0.16 },
      { asset: "cloud", x: "62%", y: "22%", size: 110, opacity: 0.18 },
    ],
    decorativePattern: "cloud-drift",
    patternOpacity: 0.05,
  },
  divider: { shape: "mountains" },
  animation: { preset: "fog-drift" },
  navigation: { style: "solid" },
  footer: { style: "rich" },
  cta: { style: "solid" },
  icon: { style: "line" },
  imageOverlay: { style: "gradient-bottom" },
  darkMode: {
    mode: "dedicated",
    background: "#12141c",
    surface: "#1c1f2b",
    primary: "#9aa8c2",
    secondary: "#8c7256",
    particleColor: "#dfe4ee",
  },
};
