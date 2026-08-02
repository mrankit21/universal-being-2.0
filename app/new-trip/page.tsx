import type { Metadata } from "next";

import { TripHeroV2 } from "@/components/trip/v2/trip-hero-v2";
import { TripTitleV2 } from "@/components/trip/v2/trip-title-v2";
import { QuickLinksV2 } from "@/components/trip/v2/quick-links-v2";
import { SectionBackdropV2 } from "@/components/trip/v2/section-backdrop-v2";
import { GalleryGridV2 } from "@/components/trip/v2/gallery-grid-v2";
import { ItineraryTimelineV2 } from "@/components/trip/v2/itinerary-timeline-v2";
import { InclusionsExclusionsV2 } from "@/components/trip/v2/inclusions-exclusions-v2";
import { PriceV2 } from "@/components/trip/v2/price-v2";
import { PickupVariantsV2 } from "@/components/trip/v2/pickup-variants-v2";
import { BatchDatesV2 } from "@/components/trip/v2/batch-dates-v2";
import { ThingsToExperienceV2 } from "@/components/trip/v2/things-to-experience-v2";
import { DidYouKnowV2 } from "@/components/trip/v2/did-you-know-v2";
import { LetsPlanYourTripV2 } from "@/components/trip/v2/lets-plan-your-trip-v2";
import { FaqAccordionV2 } from "@/components/trip/v2/faq-accordion-v2";

export const metadata: Metadata = {
  title: "Trip 2.0 UI Preview — Universal Being",
};

/**
 * Trip 2.0 — preview only.
 *
 * Separate route (`/new-trip`), not `app/trips/[slug]/page.tsx`. The live
 * trip pages still render through the existing `lib/api/trips.ts` +
 * `components/trip/*` untouched — nothing about the current integration
 * is wired up here yet. Everything below is static mock content, per
 * "phele uix without backend".
 *
 * Section order below is the serial order Ankit gave (2026-07):
 *   1. Hero image                     -> TripHeroV2 (image + floating pill only)
 *   2. Trip title                     -> TripTitleV2
 *   3. Squared quick-link boxes       -> QuickLinksV2
 *   4. Gallery                        -> GalleryGridV2
 *   5. Itinerary + Inclusion/Exclusion-> ItineraryTimelineV2 + InclusionsExclusionsV2
 *   6. Price                          -> PriceV2
 *   7. Pickup variants                -> PickupVariantsV2
 *   8. Batch dates (old-style, new UI)-> BatchDatesV2
 *   9. Things to experience           -> ThingsToExperienceV2
 *  10. Did you know                   -> DidYouKnowV2
 *  11. Let's Plan Your Trip (lead form)-> LetsPlanYourTripV2
 *  12. FAQ                            -> FaqAccordionV2
 *
 * "Let's Plan Your Trip" (added 2026-07) is the end-of-page lead-capture
 * card — for the visitor who scrolled everything and is still deciding.
 * Name, WhatsApp number, destination, travel timing; kept small/compact
 * on purpose, not a big bubbly banner. UI-only for now; once approved it
 * posts to a `/api/leads` route and fires the Meta Pixel `Lead` event so
 * the sales team can follow up by call.
 *
 * Planned next steps, mirroring how Homepage 2.0 was built:
 *   1. Review this UI — adjust sections/spacing/content as needed.
 *   2. Once approved, wire these components to real `Trip` data (a
 *      `getResolvedTrip2(slug)` resolver, same DB-first/static-fallback
 *      pattern as `lib/api/home2.ts`) instead of rewriting them.
 *   3. Admin Panel: leave the existing Trip Editor exactly as it is, and
 *      add a new "Trip 2.0" section for managing these new trip pages —
 *      same split Homepage vs. Homepage 2.0 already has.
 *   4. Responsive pass: keep one shared markup per section (no separate
 *      phone/desktop component trees) and fix any layout issue with
 *      Tailwind breakpoints, the way this file already does — Ankit only
 *      wants a per-device *admin* split as a last resort if a section
 *      truly can't be made to work responsively any other way.
 *
 * Polish pass (2026-07, third round): section vertical padding cut
 * roughly in half across the board (the plain sections were reading as
 * "empty" on a phone screen); all section headings bumped from
 * font-medium to font-semibold + tracking-tight for more presence; and
 * `SectionBackdropV2` adds a tinted photo behind Quick Links and the
 * Price/Pickup/Batch Dates block specifically — the plainest, most
 * "empty-feeling" zones — while Gallery/Itinerary/FAQ keep their own
 * existing visuals and stay as-is.
 */
export default function NewTripPreview() {
  return (
    <main className="bg-background">
      <TripHeroV2
        bookHref="/trips/spiti-valley/book"
        imageUrl="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2000&auto=format&fit=crop"
        imageAlt="Mountain valley above the clouds at sunset"
      />
      <TripTitleV2
        title="Spiti Valley, Reimagined"
        description="A 7-day journey through the cold desert of the Himalayas — monasteries, high passes, and star-filled skies."
      />
      <SectionBackdropV2
        imageUrl="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1600&auto=format&fit=crop"
        imageAlt="Nako Lake surrounded by snow-capped mountains"
      >
        <QuickLinksV2 />
      </SectionBackdropV2>
      <GalleryGridV2 />
      <ItineraryTimelineV2 />
      <InclusionsExclusionsV2 />
      <SectionBackdropV2
        imageUrl="https://images.unsplash.com/photo-1520769669658-f07657f5a307?q=80&w=1600&auto=format&fit=crop"
        imageAlt="Key Monastery perched on a Himalayan hillside"
      >
        <PriceV2 basePrice={24999} discountedPrice={21499} bookingAmount={5000} bookHref="/trips/spiti-valley/book" />
        <PickupVariantsV2 />
        <BatchDatesV2 bookHref="/trips/spiti-valley/book" />
      </SectionBackdropV2>
      <ThingsToExperienceV2 />
      <DidYouKnowV2 />
      <LetsPlanYourTripV2 destination="Spiti Valley" />
      <FaqAccordionV2 />
    </main>
  );
}
