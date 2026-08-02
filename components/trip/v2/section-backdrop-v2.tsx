import * as React from "react";

export interface SectionBackdropV2Props {
  imageUrl: string;
  imageAlt: string;
  children: React.ReactNode;
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
 */
export function SectionBackdropV2({ imageUrl, imageAlt, children }: SectionBackdropV2Props) {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} role="img" aria-label={imageAlt} />
      <div className="absolute inset-0 bg-background/88" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
