import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter, Alex_Brush } from "next/font/google";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { RootShell } from "@/components/layout/root-shell";
import { BrandProvider } from "@/components/layout/brand-provider";
import { getActiveAnnouncement } from "@/lib/api/announcements";
import { getSiteBrand } from "@/lib/api/site-brand";
import { getSiteUrl } from "@/lib/seo/site-url";

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

const alexBrush = Alex_Brush({
  subsets: ["latin"],
  weight: "400",
  variable: "--ub-font-script",
  display: "swap",
});

/**
 * Step 8 fix: this used to be a static `export const metadata` with no
 * `icons`/`openGraph.images` at all — Admin → Settings → Brand Assets let
 * you upload a Favicon, Apple Touch Icon, and OG Image (Step 7.6B §7,
 * `SiteSettingsModel.favicon/appleTouchIcon/ogImage`), but nothing ever
 * read those fields back out, so every page kept showing the generic
 * `public/favicon.png` / no share-preview image regardless of what was
 * uploaded. `generateMetadata` runs per-request (same as this file's
 * `RootLayout`), so it can call the DB-first `getSiteBrand()` — which is
 * wrapped in React `cache()`, so this and `RootLayout`'s call below share
 * one Mongo round trip, not two. Falls back to the static `public/`
 * assets only when nothing has been uploaded yet, same DB-first/
 * static-fallback rule every other brand field already follows.
 */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getSiteBrand();
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: brand.brandName,
    description: brand.tagline || "Curated trips, themed to the destination.",
    icons: {
      icon: brand.favicon?.url || "/favicon.png",
      apple: brand.appleTouchIcon?.url || "/brand/app-icon.png",
    },
    openGraph: {
      title: brand.brandName,
      description: brand.tagline,
      url: siteUrl,
      siteName: brand.brandName,
      images: brand.ogImage
        ? [{ url: brand.ogImage.url, width: brand.ogImage.width, height: brand.ogImage.height, alt: brand.ogImage.alt || brand.brandName }]
        : undefined,
    },
  };
}

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
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${alexBrush.variable}`} suppressHydrationWarning>
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
