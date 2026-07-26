"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ub-color-scheme";

/**
 * ThemeModeToggle — toggles the `.dark` class on `<html>`, the exact
 * mechanism documented in app/globals.css ("Dark mode: toggle the `.dark`
 * class on `<html>`; every semantic variable is redefined there"). This is
 * independent of the destination ThemeProvider (components/theme/theme-
 * provider.tsx), which governs *which trip mood* is active, not light/dark.
 *
 * Hydration safety: the toggle renders a neutral, non-committal icon until
 * mounted, then reads localStorage client-side only — so server HTML and
 * first client paint always match (no mismatch warning), at the cost of
 * one intentional icon "pop-in" after mount, which is the standard,
 * accepted trade-off for this pattern.
 *
 * Default is always light for a first-time visitor (no stored choice yet)
 * — deliberately NOT following `prefers-color-scheme`, since many phones
 * ship with system dark mode on by default and that shouldn't silently
 * override the site's own light-first design. Once someone taps this
 * toggle, their explicit choice is remembered via localStorage and wins
 * on every later visit.
 */
export function ThemeModeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const dark = stored === "dark";
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle color scheme"}
      className={cn("shrink-0", className)}
    >
      {mounted && isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
