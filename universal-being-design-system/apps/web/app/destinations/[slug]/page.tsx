import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDestinationBySlug, getDestinationBySlugWithResolvedImages, getDestinationSlugs } from "@/lib/api/destinations";
import { absoluteUrl } from "@/lib/seo/site-url";
import { DestinationHero } from "@/components/destination/destination-hero";
import { DestinationGallery } from "@/components/destination/destination-gallery";
import { DestinationJsonLd } from "@/components/destination/destination-json-ld";
import { TripCard } from "@/components/trip/trip-card";
import { SectionHeading } from "@/components/primitives/section-heading";
import { EmptyState } from "@/components/primitives/empty-state";
import { Tag } from "@/components/primitives/tag";
import { Compass } from "lucide-react";

interface DestinationPageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-renders every published destination at build time — same
 * `generateStaticParams` pattern the earlier `/trips/[id]` phase used. */
export async function generateStaticParams() {
  const slugs = await getDestinationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) return {};
  const canonical = absoluteUrl(`/destinations/${destination.slug}`);
  return {
    title: destination.seo.title,
    description: destination.seo.description,
    alternates: { canonical },
  };
}

/**
 * Destination Details Page — requirement #6. Shows destination context
 * (hero, gallery) plus every published trip under it — sorted and flagged
 * by the destination's own admin-editable Display Order / Featured Trips
 * settings (Step 7.6C-B Part 2 §3) — all fetched through `lib/api/*` so this
 * page never imports seed data directly.
 */
export default async function DestinationDetailPage({ params }: DestinationPageProps) {
  const { slug } = await params;
  const result = await getDestinationBySlugWithResolvedImages(slug);
  if (!result) notFound();

  const { destination, trips } = result;

  return (
    <div>
      <DestinationJsonLd destination={destination} />
      <DestinationHero destination={destination} />

      <DestinationGallery destination={destination} />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <SectionHeading title={`Trips in ${destination.name}`} className="mb-5" />

        {trips.length === 0 ? (
          <EmptyState
            icon={<Compass aria-hidden="true" />}
            title="No trips published here yet"
            description="Check back soon — new trips for this destination are on the way."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <div key={trip.slug} className="relative">
                {trip.destinationFeatured && (
                  <div className="absolute left-3 top-3 z-10">
                    <Tag tone="teal">Featured</Tag>
                  </div>
                )}
                <TripCard trip={trip} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
