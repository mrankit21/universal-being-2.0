import type { Destination } from "@/types/destination";
import { siteConfig } from "@/data/layout/site-config";
import { absoluteUrl } from "@/lib/seo/site-url";

export interface DestinationJsonLdProps {
  destination: Destination;
}

/**
 * DestinationJsonLd — Step 5.2, the same "SEO Improvements → JSON-LD /
 * Breadcrumbs" treatment `components/trip/trip-json-ld.tsx` gives Trip
 * pages, applied to Destinations. Emits a `BreadcrumbList` matching the
 * visible breadcrumb a destination page would show, plus a
 * `TouristDestination` node (schema.org's dedicated type for a place
 * that's the subject of tourism, as opposed to `TouristTrip`'s bookable
 * itinerary) describing the destination itself. Built entirely from
 * fields the Admin Panel already writes — no new SEO fields required
 * beyond `seo.title`/`seo.description` which already exist.
 */
export function DestinationJsonLd({ destination }: DestinationJsonLdProps) {
  const destinationUrl = absoluteUrl(`/destinations/${destination.slug}`);
  const image = destination.coverImage?.url || destination.heroImage?.url || undefined;

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Destinations", item: absoluteUrl("/destinations") },
      { "@type": "ListItem", position: 3, name: destination.name, item: destinationUrl },
    ],
  };

  const touristDestination = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: destination.name,
    description: destination.seo.description || destination.shortDescription,
    url: destinationUrl,
    ...(image ? { image } : {}),
    address: {
      "@type": "PostalAddress",
      addressRegion: destination.state,
      addressCountry: "IN",
    },
    includesAttraction: destination.highlights.map((highlight) => ({
      "@type": "TouristAttraction",
      name: highlight,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(touristDestination) }}
      />
    </>
  );
}
