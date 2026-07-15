"use client";

import { useTheme } from "@/hooks/use-theme";
import { themeKeys, themeRegistry } from "@/data/themes";
import { ThemeBackground } from "@/components/theme/theme-background";
import { Chip } from "@/components/primitives/chip";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * /theme-preview — Phase 3 QA harness only (Architecture §12 dev-experience
 * goal in action): every theme below is rendered through the exact same
 * markup. Switching the active theme never touches this file, ThemeBackground,
 * Card, Button, or Badge — only data/themes/*.ts changes what you see.
 */
export default function ThemePreviewPage() {
  const { theme, setThemeKey } = useTheme();

  return (
    <main className="min-h-screen">
      <ThemeBackground theme={theme} area="hero" className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
          <SectionHeading
            eyebrow="Theme Engine · Phase 3"
            title={`Previewing: ${theme.name}`}
            description="Every element below reads from ThemeConfig only — no component here knows a theme name."
          />

          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select a theme to preview">
            {themeKeys.map((key) => (
              <Chip
                key={key}
                selected={theme.key === key}
                onClick={() => setThemeKey(key)}
                role="radio"
                aria-checked={theme.key === key}
              >
                {themeRegistry[key].name}
              </Chip>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="ub-glass">
              <CardHeader>
                <Badge>{theme.particle.type}</Badge>
                <CardTitle className="font-display">Sample Trip Card</CardTitle>
                <CardDescription>
                  Card style: {theme.card.style} · Border: {theme.border.style} · Shadow: {theme.shadow.style}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button>Primary action</Button>
                <Button variant="outline">Secondary</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Typography &amp; Motion</CardTitle>
                <CardDescription>
                  Mood: {theme.typographyMood} · Animation preset: {theme.animation.preset}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Nav: {theme.navigation.style} · Footer: {theme.footer.style} · CTA: {theme.cta.style}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Decorative Layer</CardTitle>
                <CardDescription>
                  Illustration set: {theme.motifs.illustrationSet} · Pattern: {theme.motifs.decorativePattern}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Overlay — fog: {String(theme.overlay.fog)}, waves: {String(theme.overlay.waves)}, frost:{" "}
                {String(theme.overlay.frost)}
              </CardContent>
            </Card>
          </div>
        </div>
      </ThemeBackground>

      <ThemeBackground theme={theme} area="section">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-sm text-muted-foreground">
            This lower band uses <code>area=&quot;section&quot;</code> instead of{" "}
            <code>area=&quot;hero&quot;</code> — same component, different gradient slot, entirely from{" "}
            <code>ThemeConfig.palette.gradients</code>.
          </p>
        </div>
      </ThemeBackground>
    </main>
  );
}
