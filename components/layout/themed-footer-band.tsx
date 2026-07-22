"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/hooks/use-theme";
import { ThemeBackground } from "@/components/theme/theme-background";

/**
 * ThemedFooterBand — Step 7.5B footer enhancement. `SiteFooter` itself stays
 * layout-only (per its own docstring: "theme.footer.style is read by
 * whichever page wraps this in a themed ThemeBackground"); this is that
 * wrapper, applied once in `RootShell` so every page's footer picks up the
 * active theme's gradient, motifs (mountains/clouds/leaves/etc. per
 * destination mood), and particles automatically — with zero change to
 * `SiteFooter`'s own markup or content.
 *
 * Takes `<SiteFooter />` as `children` rather than importing it directly:
 * `SiteFooter` is an async Server Component (it reads Site Settings from
 * MongoDB via `lib/api/site-settings.ts`), and a Client Component ("use
 * client", needed here for `useTheme()`) can never import and render a
 * Server Component's module directly -- Next.js would try to bundle the
 * whole server-only chain (mongoose/mongodb) for the browser and fail
 * ("Can't resolve 'net'"). Passing it as `children` from the Server
 * Component that renders `<ThemedFooterBand>` (RootShell) keeps the
 * Server/Client boundary correct.
 */
export function ThemedFooterBand({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <ThemeBackground theme={theme} area="section" className="border-t border-border">
      {children}
    </ThemeBackground>
  );
}