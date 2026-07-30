import type { Metadata } from "next";

import { HeroParallax } from "@/components/home/v2/hero-parallax";
import { FloatingQuickLinks } from "@/components/home/v2/floating-quick-links";
import { FeaturedTripsStack, type FeaturedTripCardData } from "@/components/home/v2/featured-trips-stack";

export const metadata: Metadata = {
  title: "New Homepage UI Preview — Universal Being",
};

const MOCK_TRIPS: FeaturedTripCardData[] = [
  {
    id: "rajasthan-royals",
    tag: "Heritage",
    tagTone: "brass",
    title: "Rajasthan Heritage Discovery",
    description: "Explore royal palaces, timeless forts and rich cultural traditions.",
    imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Illuminated Rajasthan palace reflected in a lake at dusk",
    href: "/trips/rajasthan-heritage-discovery",
  },
  {
    id: "himalayan-explorer",
    tag: "Adventure",
    tagTone: "teal",
    title: "Himalayan Explorer",
    description: "Thrilling treks, scenic valleys and unforgettable mountain adventures.",
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Trekker looking out over a Himalayan valley",
    href: "/trips/himalayan-explorer",
  },
  {
    id: "goa-beach-getaway",
    tag: "Beach Escape",
    tagTone: "stone",
    title: "Goa Beach Getaway",
    description: "Sun, sand, sea and vibrant vibes for the perfect escape.",
    imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Palm trees and a sunset over a Goa beach",
    href: "/trips/goa-beach-getaway",
  },
];

/**
 * Homepage UI v2 — preview only.
 *
 * This is intentionally a separate route (`/new-home`), not `app/page.tsx`.
 * The live homepage still renders through `getResolvedHomepage()` and the
 * existing `components/home/*` sections untouched — nothing about the
 * current integration (Homepage CMS, MongoDB, Featured Trips/Testimonials
 * resolution) is wired up here yet. Everything below uses static mock data
 * only, per "abhi backend se connect nahin karna".
 *
 * Once the look is approved, the plan is: swap `app/page.tsx` to render
 * these v2 components in place of the current ones, then re-wire real data
 * (`getResolvedHomepage()`, `getHomepageVisibleDestinations()`, trip/
 * testimonial resolution) back into their props — no rewrite of the data
 * layer, just reconnecting it to the new visuals.
 */
export default function NewHomePreview() {
  return (
    <main className="bg-background">
      <HeroParallax
        eyebrow="Journeys that stay with you"
        heading="Find your pace in India."
        subheading="Curated trips, offbeat experiences and memories that last a lifetime."
        ctaLabel="Explore Trips"
        ctaHref="/trips"
        imageUrl="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2000&auto=format&fit=crop"
        imageAlt="Grand Rajasthan palace on a lake at golden hour"
      />

      <FloatingQuickLinks />

      <FeaturedTripsStack trips={MOCK_TRIPS} />
    </main>
  );
}
