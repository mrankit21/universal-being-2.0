import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getTripBySlug, getTripSlugs, getRelatedTrips, getTripReviewTestimonials, getCircuitSiblings } from "@/lib/api/trips";
import { getResolvedTrip2 } from "@/lib/api/trip2";
import { TripModel } from "@/lib/db/models";
import { absoluteUrl } from "@/lib/seo/site-url";
import { siteConfig } from "@/data/layout/site-config";
import { TripHero } from "@/components/trip/trip-hero";
import { TripDurationSelector } from "@/components/trip/trip-duration-selector";
import { TripDestinationRoutes } from "@/components/trip/trip-destination-routes";
import { TripGallery } from "@/components/trip/trip-gallery";
import { TripHighlights } from "@/components/trip/trip-highlights";
import { TripBookingCard } from "@/components/trip/trip-booking-card";
import { TripJsonLd } from "@/components/trip/trip-json-ld";
import { TripItinerary } from "@/components/trip/trip-itinerary";
import { TripAccommodation } from "@/components/trip/trip-accommodation";
import { TripHotelCategories } from "@/components/trip/trip-hotel-categories";
import { TripMeals } from "@/components/trip/trip-meals";
import { TripTransportation } from "@/components/trip/trip-transportation";
import { TripInclusions } from "@/components/trip/trip-inclusions";
import { TripPricingTable } from "@/components/trip/trip-pricing";
import { TripMap } from "@/components/trip/trip-map";
import { TripReviews } from "@/components/trip/trip-reviews";
import { TripFAQ } from "@/components/trip/trip-faq";
import { TripTerms } from "@/components/trip/trip-terms";
import { RelatedTrips } from "@/components/trip/related-trips";
import { TripStickyActions } from "@/components/trip/trip-sticky-actions";
import { TripSectionNav, TRIP_SECTION_NAV_ITEMS } from "@/components/trip/trip-section-nav";
import { TripPickupVariants } from "@/components/trip/trip-pickup-variants";
import { getPublishedPickupVariants } from "@/lib/trip/pickup-variants";

interface TripPageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-renders every published trip at build time. */
export async function generateStaticParams() {
  const slugs = await getTripSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: TripPageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) return {};

  const canonical = trip.seo.canonicalUrl || absoluteUrl(`/trips/${trip.slug}`);
  const ogImage = trip.seo.ogImage?.url || trip.heroImage.url;

  return {
    title: trip.seo.title,
    description: trip.seo.description,
    keywords: trip.seo.keywords?.length ? trip.seo.keywords : undefined,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: siteConfig.brandName,
      title: trip.seo.title,
      description: trip.seo.description,
      url: canonical,
      images: ogImage ? [{ url: ogImage, alt: trip.seo.ogImage?.alt || trip.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: trip.seo.title,
      description: trip.seo.description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/**
 * Trip Details Page — requirement #6, the full Architecture §2 composition:
 * TripHero → TripBookingCard → TripDurationSelector → TripPricingTable →
 * TripGallery → TripHighlights → TripItinerary → TripInclusions → TripMap →
 * TripFAQ → TripTerms → RelatedTrips, plus `TripStickyActions` mounting the
 * persistent WhatsApp/Call bar. Every
 * section is optional and self-hides when its data is empty, so a
 * partially-filled Admin Panel entry still renders a coherent page instead
 * of empty section shells.
 *
 * `TripSectionNav` (Sticky Section Navigation Strip) sits directly below
 * the Book Now box in both compositions below. It reads whichever section
 * ids actually landed in the DOM — via `TRIP_SECTION_NAV_ITEMS` — so it
 * never needs its own CMS entry and automatically tracks whatever sections
 * a given Trip actually renders, including future ones (Reviews, Signature
 * Journeys, more pickup-variant sub-sections) once they're added there.
 */
export default async function TripDetailPage({ params }: TripPageProps) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  // "Active Homepage"-style switch (Site Settings), but per-trip: an
  // editor can flip a single Trip over to its Trip 2.0 design from the
  // Trip Editor's "Page Version" field, same idea as the Homepage
  // Original/2.0 switch. Everything below this block — the entire
  // original composition — is completely untouched and still runs
  // byte-for-byte the same for every "v1" (default) trip; a lightweight
  // standalone lookup here (not the shared `getTripBySlug` mapper) keeps
  // this check additive rather than threading a new field through the
  // existing Trip type and every place that consumes it.
  const versionDoc = await TripModel.findOne({ slug }).select("activeVersion").lean();
  if (versionDoc?.activeVersion === "v2") {
    const trip2 = await getResolvedTrip2(slug);
    if (trip2) redirect(`/trip2/${slug}`);
    // No matching published Trip 2.0 page yet — fall through and keep
    // serving the original design rather than 404ing a live trip page.
  }

  const relatedTrips = await getRelatedTrips(trip);
  const assignedReviews = await getTripReviewTestimonials(trip);
  const circuitSiblings = await getCircuitSiblings(trip);

  // Pickup Variant Architecture (2026-07): a Trip with published pickup
  // variants renders its booking card, pricing/batches, itinerary,
  // transportation, and destination-route sections through
  // `TripPickupVariants` instead — same components, driven by whichever
  // pickup city the visitor picks. A Trip with no pickup variants (the
  // default) falls through to the exact original composition below,
  // byte-for-byte unchanged.
  const hasPickupVariants = getPublishedPickupVariants(trip).length > 0;

  return (
    <div className="pb-16">
      <TripJsonLd trip={trip} />
      <TripStickyActions trip={trip} />
      <TripHero trip={trip} />
      {hasPickupVariants ? (
        <>
          <TripPickupVariants trip={trip} />
          <TripSectionNav items={TRIP_SECTION_NAV_ITEMS} />
          <TripDurationSelector trip={trip} siblings={circuitSiblings} />
          <TripGallery trip={trip} />
          <TripHighlights trip={trip} />
          <TripAccommodation trip={trip} />
          <TripHotelCategories trip={trip} />
          <TripMeals trip={trip} />
          <TripInclusions trip={trip} />
          <TripMap trip={trip} />
        </>
      ) : (
        <>
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-xs sm:max-w-[280px]">
              <TripBookingCard trip={trip} />
            </div>
          </div>
          <TripSectionNav items={TRIP_SECTION_NAV_ITEMS} />
          <TripDurationSelector trip={trip} siblings={circuitSiblings} />
          <TripPricingTable trip={trip} />
          <TripGallery trip={trip} />
          <TripHighlights trip={trip} />
          <TripItinerary trip={trip} />
          <TripAccommodation trip={trip} />
          <TripHotelCategories trip={trip} />
          <TripMeals trip={trip} />
          <TripTransportation trip={trip} />
          <TripInclusions trip={trip} />
          <TripDestinationRoutes trip={trip} />
          <TripMap trip={trip} />
        </>
      )}
      <TripReviews trip={trip} assignedReviews={assignedReviews} />
      <TripFAQ trip={trip} />
      <TripTerms trip={trip} />
      <RelatedTrips trips={relatedTrips} />
    </div>
  );
}