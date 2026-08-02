import * as React from "react";

export interface SectionBackdropV2Props {
  imageUrl: string;
  imageAlt: string;
  children: React.ReactNode;
  /** 0-100 tint strength over the photo. 100 = photo fully hidden, 0 =
   * photo at full strength. Defaults to 88 (the original hardcoded
   * value) when not passed — e.g. from an admin-set
   * `Trip.sectionBackdrops.*.opacity`. */
  opacity?: number;
}

/**
 * Trip 2.0 UI — shared background-image wrapper. Added (2026-07) after
 * feedback that the plain cream sections (Quick Links, Price, Pickup,
 * Batch Dates) felt too empty — same idea as the visitabudhabi.ae
 * reference: a themed photo behind the section with a soft tint so the
 * existing cards/text still read clearly on top, instead of a flat
 * background color.
 *
 * Kept as a light tint (not the reference's bold color-diagonal) since
 * these sections already carry white cards that need contrast; a
 * stronger overlay would fight the card system. Wrap only the sections
 * that were reading as "empty" — Gallery/FAQ/Itinerary already have
 * their own photos/lists and don't need this.
 *
 * Revision (2026-08): `opacity` is now a prop instead of the hardcoded
 * `bg-background/88` class, so it can come from an admin-set
 * `Trip.sectionBackdrops.*.opacity`. It's applied via inline `style`
 * rather than a Tailwind class because the value is only known at
 * request time — a dynamic class string like `bg-background/${n}` can't
 * be picked up by Tailwind's build-time scanner.
 */
export function SectionBackdropV2({ imageUrl, imageAlt, children, opacity = 88 }: SectionBackdropV2Props) {
  const clampedOpacity = Math.min(100, Math.max(0, opacity));
  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} role="img" aria-label={imageAlt} />
      <div className="absolute inset-0 bg-background" style={{ opacity: clampedOpacity / 100 }} aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
