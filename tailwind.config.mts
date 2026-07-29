import type { Config } from "tailwindcss";

/**
 * Tailwind v4 is CSS-first (see app/globals.css `@theme`), so this file
 * stays intentionally thin: it only sets darkMode strategy and content
 * globs. All tokens (color/type/spacing/radius/shadow) live in globals.css
 * as the single source of truth — do not duplicate values here.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
};

export default config;
