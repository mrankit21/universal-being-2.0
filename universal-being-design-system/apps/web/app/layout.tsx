import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { RootShell } from "@/components/layout/root-shell";
import { BrandProvider } from "@/components/layout/brand-provider";
import { getActiveAnnouncement } from "@/lib/api/announcements";
import { getSiteBrand } from "@/lib/api/site-brand";

import "./globals.css";
import "@/styles/themes.css";

/**
 * Phase 2's DESIGN_SYSTEM.md deferred font loading and ThemeProvider wiring
 * to this file explicitly ("the runtime theme-switching engine ... is
 * Phase 3+"). Assigning the CSS variable names globals.css already declares
 * (`--ub-font-display` / `--ub-font-sans`) means every component that
 * already reaches for `font-display`/`font-sans` needs no changes at all.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--ub-font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--ub-font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Universal Being",
  description: "Curated trips, themed to the destination.",
};

/**
 * Root layout — resolves the default themeKey ("brand") and hands it to
 * ThemeProvider. A trip detail page or the homepage will later pass its own
 * resolved themeKey down by wrapping its subtree in a nested ThemeProvider
 * (or by lifting themeKey resolution here once trip data fetching lands) —
 * either way, no page ever writes `if (theme === ...)` itself.
 *
 * Phase 4 adds RootShell inside ThemeProvider: the Global Layout (header,
 * footer, announcement bar, mobile bottom nav, sticky CTA, global search)
 * needs the active ThemeConfig (nav/footer/CTA style, glass intensity) for
 * every render, so it must sit inside — not beside — the theme boundary.
 * `children` (the actual page) renders inside RootShell's <main>, so every
 * route automatically inherits the full Global Layout with no per-page
 * wiring.
 *
 * Step 7.6C-B Part 2: this is now an async Server Component so it can call
 * `getActiveAnnouncement()` (MongoDB first, static seed fallback) once and
 * hand the result to RootShell as a prop — RootShell no longer imports
 * `data/layout/announcement.ts` directly, closing the last static-data gap
 * on every page (announcement bar renders on all routes via this layout).
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const [announcement, brand] = await Promise.all([getActiveAnnouncement(), getSiteBrand()]);

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider themeKey="brand">
          <BrandProvider brand={brand}>
            <RootShell announcement={announcement}>{children}</RootShell>
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
