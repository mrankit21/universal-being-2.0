import type { ReactNode } from "react";

import type { AnnouncementConfig } from "@/types/layout";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemedFooterBand } from "@/components/layout/themed-footer-band";
import { BottomNav } from "@/components/layout/bottom-nav";
import { StickyCtaBar } from "@/components/layout/sticky-cta-bar";
import { StickyCtaProvider } from "@/components/layout/sticky-cta-context";
import { GlobalSearchProvider } from "@/components/layout/search-context";
import { GlobalSearchModal } from "@/components/layout/global-search-modal";
import { HideOnAdmin } from "@/components/layout/admin-route-gate";
import { CustomerAuthProvider } from "@/components/layout/customer-auth-context";
import { CustomerAuthModal } from "@/components/layout/customer-auth-modal";

/**
 * RootShell — the complete Global Layout (Phase 4). Every page rendered
 * as `children` automatically inherits: announcement bar, header
 * (desktop + mobile), footer, mobile bottom nav, sticky CTA bar, and
 * global search — with zero per-page wiring, per the Phase 4 rule "future
 * pages must automatically inherit this layout."
 *
 * `/admin/**` keeps the public header/announcement/bottom-nav/sticky-CTA
 * (useful for jumping over to the live site while working in admin) but
 * skips the public footer — it's public-site marketing chrome (nav links,
 * socials, newsletter) with no purpose inside the admin panel. That check
 * needs `usePathname`, which only works in a Client Component — so it's
 * isolated in `<HideOnAdmin>` rather than making this whole file a client
 * component. SiteFooter fetches from MongoDB via mongoose; if this file
 * itself became "use client" and still imported SiteFooter directly,
 * webpack would try to bundle mongoose for the browser and crash with
 * "Module not found: Can't resolve 'net'" — keep RootShell a Server
 * Component for exactly that reason.
 *
 * Server component: nothing here holds state itself, so nothing forces a
 * "use client" boundary at this level — every interactive piece
 * (scroll-aware header chrome, drawers, dismiss/search state) is isolated
 * inside its own leaf component instead.
 *
 * Step 7.6C-B Part 2: `announcement` is now a prop instead of a direct
 * `data/layout/announcement.ts` import — `app/layout.tsx` resolves it once
 * via `getActiveAnnouncement()` (MongoDB first, static seed as fallback)
 * and passes it down, the same DB-first swap point every other section of
 * the site already uses. RootShell itself still fetches nothing.
 */
export function RootShell({
  children,
  announcement,
}: {
  children: ReactNode;
  announcement: AnnouncementConfig | null;
}) {
  return (
    <CustomerAuthProvider>
      <GlobalSearchProvider>
        <StickyCtaProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <AnnouncementBar config={announcement} />
          <SiteHeader />

          <main id="main-content" className="min-h-[60vh]">
            {children}
          </main>

          <HideOnAdmin>
            <ThemedFooterBand>
              <SiteFooter />
            </ThemedFooterBand>
          </HideOnAdmin>
          <BottomNav />
          <StickyCtaBar />
          <GlobalSearchModal />
          <CustomerAuthModal />
        </StickyCtaProvider>
      </GlobalSearchProvider>
    </CustomerAuthProvider>
  );
}