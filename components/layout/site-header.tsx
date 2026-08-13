import { DesktopHeader } from "@/components/layout/desktop-header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { getSiteSettings } from "@/lib/api/site-settings";

/**
 * SiteHeader — Phase 4 lists "Desktop Header" and "Mobile Header" as
 * distinct build items, so they're two separate files with two distinct
 * visual treatments. Both are always in the DOM; Tailwind breakpoints
 * (`hidden md:block` / `md:hidden`, set inside each component) decide
 * which one paints. This is deliberate: a `useMediaQuery`/`useEffect`
 * approach would render one header on the server and possibly swap to the
 * other on the client, which is exactly the hydration mismatch + layout
 * shift the Phase 4 Performance section rules out.
 *
 * Revision (2026-08): resolves the admin-configurable header/bottom-nav
 * colors (Admin -> Site Settings -> Header & Navigation Colors) once here
 * and hands them to the page as two CSS custom properties on `:root` --
 * `--ub-header-color` and `--ub-bottomnav-color`. `.ub-nav-blue` /
 * `.ub-nav-black` (app/globals.css) read those vars with the original
 * hardcoded hex as fallback, so this single `<style>` tag is enough to
 * recolor the desktop header, mobile header, *and* the mobile bottom pill
 * nav (`BottomNav`, rendered elsewhere in `RootShell`) -- no prop drilling
 * or client-side settings fetch needed in any of those three components.
 * This stays a Server Component for the same mongoose-bundling reason
 * documented on `RootShell`.
 */
export async function SiteHeader() {
  const { headerColor, bottomNavColor } = await getSiteSettings();

  return (
    <>
      <style>{`:root{--ub-header-color:${headerColor};--ub-bottomnav-color:${bottomNavColor};}`}</style>
      <DesktopHeader />
      <MobileHeader />
    </>
  );
}
