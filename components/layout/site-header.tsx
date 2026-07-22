import { DesktopHeader } from "@/components/layout/desktop-header";
import { MobileHeader } from "@/components/layout/mobile-header";

/**
 * SiteHeader — Phase 4 lists "Desktop Header" and "Mobile Header" as
 * distinct build items, so they're two separate files with two distinct
 * visual treatments. Both are always in the DOM; Tailwind breakpoints
 * (`hidden md:block` / `md:hidden`, set inside each component) decide
 * which one paints. This is deliberate: a `useMediaQuery`/`useEffect`
 * approach would render one header on the server and possibly swap to the
 * other on the client, which is exactly the hydration mismatch + layout
 * shift the Phase 4 Performance section rules out.
 */
export function SiteHeader() {
  return (
    <>
      <DesktopHeader />
      <MobileHeader />
    </>
  );
}
