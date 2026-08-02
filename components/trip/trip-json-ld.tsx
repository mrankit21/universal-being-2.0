import type { Trip } from "@/types/trip";
import { siteConfig } from "@/data/layout/site-config";
import { absoluteUrl } from "@/lib/seo/site-url";

export interface TripJsonLdProps {
  trip: Trip;
}

/**
 * TripJsonLd — Step 7.6E Part 9 "SEO Improvements → JSON-LD / Breadcrumbs".
 * Emits a `BreadcrumbList` matching the visible `BreadcrumbTrail` in
 * `TripHero`, plus a `TouristTrip` node (schema.org's dedicated type for
 * this exact content — a bookable multi-day trip with an offer, distinct
 * from a generic `Product`) describing price, availability, and rating.
 * Built entirely from fields the Admin Panel already writes — no new SEO
 * fields required beyond `seo.title`/`seo.description` which already
 * exist.
 */
export function TripJsonLd({ trip }: TripJsonLdProps) {
  const tripUrl = absoluteUrl(`/trips/${trip.slug}`);
  const offerPrice = trip.price.discounted ?? trip.price.base;
  const image = trip.seo.ogImage?.url || trip.heroImage.url || undefined;

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Destinations", item: absoluteUrl("/destinations") },
      {
        "@type": "ListItem",
        position: 3,
        name: trip.destinationName,
        item: absoluteUrl(`/destinations/${trip.destinationSlug}`),
      },
      { "@type": "ListItem", position: 4, name: trip.title, item: tripUrl },
    ],
  };

  const touristTrip = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trip.title,
    description: trip.seo.description || trip.shortDescription,
    url: tripUrl,
    ...(image ? { image } : {}),
    touristType: trip.difficulty,
    itinerary: trip.itinerary.map((day) => ({
      "@type": "TouristAttraction",
      name: day.title,
      description: day.description,
    })),
    offers: {
      "@type": "Offer",
      priceCurrency: trip.price.currency,
      price: offerPrice,
      availability: trip.availableSeats > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: tripUrl,
    },
    provider: {
      "@type": "TravelAgency",
      name: siteConfig.brandName,
      url: absoluteUrl("/"),
    },
  };

  // Google Search Console — "Review snippets structured data" flags
  // `aggregateRating` on `TouristTrip` as "Invalid object type for field
  // '<parent_node>'": TouristTrip isn't one of the parent types Google
  // supports for review-snippet rich results (Product, LocalBusiness,
  // Recipe, Course, etc. are). So the rating now goes on its own separate
  // `Product` node instead — a type Google *does* support for review
  // snippets — while `TouristTrip` above stays exactly as it was, minus
  // the field that was causing the error.
  const reviewProduct =
    trip.reviewCount > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: trip.title,
          description: trip.seo.description || trip.shortDescription,
          ...(image ? { image } : {}),
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: trip.rating,
            reviewCount: trip.reviewCount,
          },
          offers: {
            "@type": "Offer",
            priceCurrency: trip.price.currency,
            price: offerPrice,
            availability: trip.availableSeats > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
            url: tripUrl,
          },
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(touristTrip) }}
      />
      {reviewProduct ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewProduct) }}
        />
      ) : null}
    </>
  );
}
