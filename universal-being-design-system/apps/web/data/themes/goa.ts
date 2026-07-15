import type { ThemeConfig } from "@/types/theme";

/** Goa — Step 7.5D. Warmer sunset variant of the generic `beachTheme`:
 * flying-bird particles, deeper orange sunset gradient, water reflections. */
export const goaTheme: ThemeConfig = {
  key: "goa",
  name: "Goa",
  palette: {
    primary: "#e0703f",
    secondary: "#1e8fa3",
    accent: "#ffd08a",
    background: "#fff3e8",
    surface: "#ffffff",
    foreground: "#2b1608",
    gradients: {
      hero: { angle: 150, stops: [{ color: "#ffd6a0", stop: 0 }, { color: "#f0824a", stop: 55 }, { color: "#7a3a5c", stop: 100 }] },
      section: { angle: 180, stops: [{ color: "#ffffff", stop: 0 }, { color: "#fff3e8", stop: 100 }] },
      cta: { angle: 120, stops: [{ color: "#e0703f", stop: 0 }, { color: "#c2542a", stop: 100 }] },
    },
  },
  typographyMood: "airy",
  border: { style: "pill", radius: "1.25rem" },
  shadow: { style: "soft" },
  glass: { intensity: 0.2 },
  button: { style: "pill" },
  card: { style: "elevated" },
  section: { background: "surface" },
  hero: { background: "gradient" },
  particle: { type: "birds", density: 10, speed: 18, color: "#3a2418" },
  overlay: { fog: false, waves: true, frost: false },
  motifs: {
    illustrationSet: "palm",
    placements: [
      { asset: "palm", x: "3%", y: "60%", size: 200, opacity: 0.2, rotate: -6 },
      { asset: "sun", x: "82%", y: "12%", size: 90, opacity: 0.28 },
      { asset: "bird", x: "68%", y: "18%", size: 40, opacity: 0.2 },
    ],
    decorativePattern: "wave-lines",
    patternOpacity: 0.06,
  },
  animation: { preset: "wave-motion" },
  divider: { shape: "ocean" },
  navigation: { style: "transparent" },
  footer: { style: "illustrated" },
  cta: { style: "gradient" },
  icon: { style: "filled" },
  imageOverlay: { style: "gradient-full" },
  darkMode: {
    mode: "dedicated",
    background: "#241108",
    surface: "#341a0d",
    primary: "#f0824a",
    secondary: "#1e8fa3",
    particleColor: "#ffd6a0",
  },
};
