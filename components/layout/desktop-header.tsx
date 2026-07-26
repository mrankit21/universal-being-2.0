"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { siteConfig } from "@/data/layout/site-config";
import { Logo } from "@/components/layout/logo";
import { NavLink } from "@/components/layout/nav-link";
import { Button } from "@/components/ui/button";
import { GlobalSearchTrigger } from "@/components/layout/global-search-trigger";
import { ProfileButton } from "@/components/layout/profile-button";
import { ThemeModeToggle } from "@/components/layout/theme-mode-toggle";

/**
 * DesktopHeader — hidden below `md`, shown at `md:flex` by SiteHeader.
 * Reads `theme.navigation.style` ("solid" | "transparent" | "glass") so it
 * never hardcodes which look is active per destination mood — same rule
 * as every other themed surface in this codebase (types/theme.ts).
 */
export function DesktopHeader() {
  const { theme } = useTheme();
  const { isScrolled } = useScrollPosition(24);

  // transparent-style nav goes solid/glass once scrolled, so copy stays
  // legible over a hero image; solid/glass styles are already legible and
  // just shrink.
  const navStyle =
    theme.navigation.style === "transparent" && !isScrolled ? "transparent" : theme.navigation.style;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 hidden w-full md:block ub-nav-blue",
        "transition-[height,background-color,backdrop-filter] duration-ub-base ease-ub-standard",
        navStyle === "glass" && "ub-glass border-b border-border/60",
        navStyle === "solid" && "border-b border-border bg-background/95",
        navStyle === "transparent" && "border-b border-transparent bg-transparent"
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between px-6 transition-[height] duration-ub-base ease-ub-standard",
          isScrolled ? "h-16" : "h-20"
        )}
      >
        <Logo />

        <nav aria-label="Primary" className="flex items-center gap-8">
          {siteConfig.primaryNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <GlobalSearchTrigger variant="full" className="mr-1 hidden lg:inline-flex" />
          <GlobalSearchTrigger variant="icon" className="lg:hidden" />
          <ThemeModeToggle />
          <ProfileButton />
          <Button size="sm" className="ml-2" asChild>
            <a href={siteConfig.contact.whatsappHref} target="_blank" rel="noopener noreferrer">
              Plan a trip
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
