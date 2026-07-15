import { Logo } from "@/components/layout/logo";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { GlobalSearchTrigger } from "@/components/layout/global-search-trigger";

/**
 * MobileHeader — server component; the only client work (drawer open
 * state, search trigger) lives in its two leaf children. Shown only below
 * `md` via SiteHeader's wrapper, so there is exactly one header in the DOM
 * per breakpoint — no duplicate landmark, no layout shift on resize.
 */
export function MobileHeader() {
  return (
    <header className="ub-glass sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/60 px-4 md:hidden">
      <Logo />
      <div className="flex items-center gap-0.5">
        <GlobalSearchTrigger variant="icon" />
        <MobileNavDrawer />
      </div>
    </header>
  );
}
