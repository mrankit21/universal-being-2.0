/**
 * Shared preset scale for `SectionBackdropV2`'s overlay opacity, used by
 * both the per-trip `Trip2.sectionBackdrops.*` (Quick Links, Price) and
 * the site-wide `SiteSettings.trip2SectionBackdrops.*` (Day by Day
 * Itinerary, Inclusions & Exclusions, Batch Dates, Things To Experience,
 * Did You Know).
 *
 * Admins pick a step 1-7 instead of a raw 0-100 number — step 1 is the
 * lightest tint (photo shows through the most), step 7 is the darkest
 * (photo barely visible). Step 6 resolves to 88%, matching the opacity
 * `SectionBackdropV2` originally hardcoded, so any backdrop left on the
 * default step looks identical to before this scale existed.
 */
export const SECTION_BACKDROP_OPACITY_STEPS = [20, 35, 50, 65, 78, 88, 96] as const;

export const DEFAULT_SECTION_BACKDROP_STEP = 6;

export type SectionBackdropStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const SECTION_BACKDROP_STEP_OPTIONS: { step: SectionBackdropStep; label: string; percent: number }[] =
  SECTION_BACKDROP_OPACITY_STEPS.map((percent, i) => ({
    step: (i + 1) as SectionBackdropStep,
    percent,
    label: `${i + 1} — ${i === 0 ? "Lightest" : i === SECTION_BACKDROP_OPACITY_STEPS.length - 1 ? "Darkest" : percent + "%"}`,
  }));

/** Converts an admin-picked 1-7 step into the 0-100 overlay percentage
 * `SectionBackdropV2` expects. Out-of-range or missing values fall back
 * to the default step rather than erroring, since this only ever affects
 * a background tint. */
export function opacityStepToPercent(step: number | undefined): number {
  const clamped = Math.min(7, Math.max(1, Math.round(step ?? DEFAULT_SECTION_BACKDROP_STEP)));
  return SECTION_BACKDROP_OPACITY_STEPS[clamped - 1];
}
