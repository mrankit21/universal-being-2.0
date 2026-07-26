"use client";

import { cn } from "@/lib/utils";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { siteConfig } from "@/data/layout/site-config";
import { NavLink } from "@/components/layout/nav-link";

/**
 * BottomNav — mobile-only (hidden at `md:`), floating pill above the
 * thumb zone rather than edge-to-edge, so it never collides with a
 * device's own home-indicator gesture area. Auto-hides on scroll-down and
 * reappears on scroll-up (a `direction === null` first-paint state keeps
 * it visible by default, matching SSR).
 *
 * Only items with `showInBottomNav: true` appear here — the same
 * `siteConfig.primaryNav` array that feeds the desktop nav, so adding a
 * destination-facing nav item never means updating two lists.
 */
export function BottomNav() {
  const { direction } = useScrollPosition(24);
  const items = siteConfig.primaryNav.filter((item) => item.showInBottomNav);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "ub-glass ub-nav-blue fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full border border-border/60 py-1.5 shadow-ub-lg md:hidden",
        "transition-transform duration-ub-base ease-ub-standard",
        direction === "down" ? "translate-y-24" : "translate-y-0"
      )}
    >
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          showIcon
          className="flex-col gap-0.5 px-3 py-1.5 text-[11px]"
          activeClassName="text-primary"
        />
      ))}
    </nav>
  );
}
