import { headers } from "next/headers";

/**
 * Device-based Homepage/Trips version resolution (2026-08).
 *
 * Site Settings' "Active Homepage" and "Active Trips Design" each have a
 * third option now — "auto" — alongside the existing manual "v1"/"v2"
 * force:
 *   - "v1" / "v2": exactly as before — every visitor, on every device,
 *     gets that version.
 *   - "auto": decided per-request from the visitor's User-Agent.
 *     Phones/tablets resolve to "v2" (Homepage 2.0 / Trip 2.0);
 *     laptops/desktops resolve to "v1" (original). This is what makes
 *     "2.0 on phone, 1.0 on laptop" happen automatically — no per-device
 *     admin toggle needed, and no separate action for anyone using the
 *     site on different machines.
 *
 * Every entry point that used to compare `siteSettings.activeHomepageVersion`
 * / `activeTripsVersion` directly to `"v2"` should call `resolveVersion()`
 * instead, so "auto" is honored consistently everywhere (homepage, mobile
 * header, /trips redirect, per-trip page). Server Components / Route
 * Handlers only — this reads the incoming request's headers.
 */
export type SiteVersionSetting = "v1" | "v2" | "auto";

const MOBILE_UA_REGEX = /Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini|Mobile/i;

/** True when the current request's User-Agent looks like a phone/tablet
 * rather than a laptop/desktop browser. */
export async function isMobileDevice(): Promise<boolean> {
  const headersList = await headers();
  const ua = headersList.get("user-agent") ?? "";
  return MOBILE_UA_REGEX.test(ua);
}

/** Resolves a Site Settings version field ("v1" | "v2" | "auto") down to
 * the concrete "v1" | "v2" that should render for the current request. */
export async function resolveVersion(setting: SiteVersionSetting): Promise<"v1" | "v2"> {
  if (setting === "auto") {
    return (await isMobileDevice()) ? "v2" : "v1";
  }
  return setting;
}
