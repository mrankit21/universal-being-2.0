import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTripBySlug, getTripSlugs, getRelatedTrips, getTripReviewTestimonials, getCircuitSiblings } from "@/lib/api/trips";
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
 */
export default async function TripDetailPage({ params }: TripPageProps) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  const relatedTrips = await getRelatedTrips(trip);
  const assignedReviews = await getTripReviewTestimonials(trip);
  const circuitSiblings = await getCircuitSiblings(trip);

  return (
    <div className="pb-16">
      <TripJsonLd trip={trip} />
      <TripStickyActions trip={trip} />
      <TripHero trip={trip} />
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-xs sm:max-w-[280px]">
          <TripBookingCard trip={trip} />
        </div>
      </div>
      <TripDurationSelector trip={trip} siblings={circuitSiblings} />
      <TripPricingTable trip={trip} />
      <TripGallery trip={trip} />
      <TripHighlights trip={trip} />
      <TripItinerary trip={trip} />
      <TripAccommodation trip={trip} />
      <TripMeals trip={trip} />
      <TripTransportation trip={trip} />
      <TripInclusions trip={trip} />
      <TripDestinationRoutes trip={trip} />
      <TripMap trip={trip} />
      <TripReviews trip={trip} assignedReviews={assignedReviews} />
      <TripFAQ trip={trip} />
      <TripTerms trip={trip} />
      <RelatedTrips trips={relatedTrips} />
    </div>
  );
}