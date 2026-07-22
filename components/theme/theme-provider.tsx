"use client";

import * as React from "react";

import type { ThemeConfig, ThemeKey } from "@/types/theme";
import { resolveTheme } from "@/lib/theme/theme-resolver";
import { buildThemeCssVars } from "@/lib/theme/theme-engine";

interface ThemeContextValue {
  theme: ThemeConfig;
  themeKey: ThemeKey;
  /** Client-side override, e.g. admin theme-tuning live preview (Architecture §7). */
  setThemeKey: (key: string) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * The resolved themeKey for this route, decided server-side (e.g. the
   * featured trip's `themeKey`, or a trip detail page's own theme). Passing
   * it as a prop — rather than resolving inside an effect — means the
   * server-rendered HTML and the first client render agree exactly, so
   * there is no flash-of-wrong-theme and no hydration warning.
   */
  themeKey?: string | null;
}

/**
 * ThemeProvider — Architecture §4: "ThemeProvider (root layout) reads the
 * active trip's themeKey, resolves the matching ThemeConfig, and injects
 * CSS variables ... no per-component theme conditionals."
 *
 * Two injection paths, deliberately redundant:
 *  1. `data-theme="<key>"` on the wrapper — matched by the static,
 *     zero-JS `[data-theme]` blocks in styles/themes.css. This is what
 *     actually paints the page and is present in the very first HTML byte.
 *  2. Inline CSS variables via `buildThemeCssVars` — a client-computed
 *     mirror, useful once `setThemeKey` is used for a live client-side
 *     preview (admin theme tuning) without waiting for a route change.
 */
export function ThemeProvider({ children, themeKey }: ThemeProviderProps) {
  const [activeKey, setActiveKey] = React.useState<string>(themeKey ?? "brand");

  // Keep in sync if the server-resolved key changes across navigations
  // (e.g. moving between two trips with different themeKeys).
  React.useEffect(() => {
    if (themeKey && themeKey !== activeKey) setActiveKey(themeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeKey]);

  const theme = React.useMemo(() => resolveTheme(activeKey), [activeKey]);
  const cssVars = React.useMemo(() => buildThemeCssVars(theme), [theme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, themeKey: theme.key, setThemeKey: setActiveKey }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={theme.key} style={cssVars as React.CSSProperties}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return ctx;
}
