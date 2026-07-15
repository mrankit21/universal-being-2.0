import type { ThemeConfig, ThemeKey } from "@/types/theme";
import { themeRegistry, themeKeys } from "@/data/themes";

/**
 * resolveTheme — the single function that turns a `themeKey` (from a Trip
 * document, an admin preview selection, or a URL param) into a concrete
 * ThemeConfig. This is intentionally the ONLY place with a fallback rule,
 * so route/page code never needs an `if (theme === ...)` of its own.
 *
 * Architecture §4: "Homepage theme = theme of the currently featured/hero
 * trip, falling back to a neutral 'brand' theme when no trip is featured."
 * Same rule applies to any unrecognized/legacy/mistyped key.
 */
export function resolveTheme(themeKey: string | null | undefined): ThemeConfig {
  if (themeKey && isThemeKey(themeKey)) {
    return themeRegistry[themeKey];
  }
  return themeRegistry.brand;
}

export function isThemeKey(value: string): value is ThemeKey {
  return (themeKeys as string[]).includes(value);
}
