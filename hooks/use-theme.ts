"use client";

import { useThemeContext } from "@/components/theme/theme-provider";
import type { ThemeConfig } from "@/types/theme";

/**
 * useTheme — returns the active ThemeConfig plus a setter for client-side
 * overrides. This is the ONLY supported way a component reads "what theme
 * is active" — never import a theme data file directly from a domain or
 * layout component.
 */
export function useTheme(): { theme: ThemeConfig; setThemeKey: (key: string) => void } {
  const { theme, setThemeKey } = useThemeContext();
  return { theme, setThemeKey };
}
