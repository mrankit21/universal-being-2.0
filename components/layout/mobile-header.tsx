import { Logo } from "@/components/layout/logo";
import { MobileHeaderRight } from "@/components/layout/mobile-header-right";
import { getSiteSettings } from "@/lib/api/site-settings";

/**
 * MobileHeader — server component; the only client work (drawer open
 * state, search trigger, and — for Trip 2.0/Homepage 2.0 — route
 * detection) lives in `MobileHeaderRight` and its children. Shown only
 * below `md` via SiteHeader's wrapper, so there is exactly one header in
 * the DOM per breakpoint — no duplicate landmark, no layout shift on
 * resize.
 *
 * Revision (2026-08): now fetches Site Settings (same DB-first call every
 * other version-aware section already makes) just to read
 * `activeHomepageVersion`, and passes it to `MobileHeaderRight` so it can
 * tell whether the homepage is currently running Homepage 2.0 — needed so
 * the new pill controls only show there and on `/trip2/**`, never on v1
 * pages.
 */
export async function MobileHeader() {
  const siteSettings = await getSiteSettings();

  return (
    <header className="ub-glass ub-nav-blue sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/60 px-4 md:hidden">
      <Logo />
      <div className="flex items-center gap-2">
        <MobileHeaderRight homepage2Active={siteSettings.activeHomepageVersion === "v2"} />
      </div>
    </header>
  );
}
