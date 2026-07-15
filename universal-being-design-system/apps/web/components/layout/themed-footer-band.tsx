"use client";

import { useTheme } from "@/hooks/use-theme";
import { ThemeBackground } from "@/components/theme/theme-background";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * ThemedFooterBand — Step 7.5B footer enhancement. `SiteFooter` itself stays
 * layout-only (per its own docstring: "theme.footer.style is read by
 * whichever page wraps this in a themed ThemeBackground"); this is that
 * wrapper, applied once in `RootShell` so every page's footer picks up the
 * active theme's gradient, motifs (mountains/clouds/leaves/etc. per
 * destination mood), and particles automatically — with zero change to
 * `SiteFooter`'s own markup or content.
 */
export function ThemedFooterBand() {
  const { theme } = useTheme();
  return (
    <ThemeBackground theme={theme} area="section" className="border-t border-border">
      <SiteFooter />
    </ThemeBackground>
  );
}
