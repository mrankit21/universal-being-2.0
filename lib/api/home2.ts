import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { HomepageV2Model, type HomepageV2Document } from "@/lib/db/models";
import { getTripBySlug, getFeaturedTrips as getStaticFeaturedFallback } from "@/lib/api/trips";
import type { Trip } from "@/types/trip";
import type { QuickLinkItem } from "@/components/home/v2/floating-quick-links";
import type { FeaturedTripCardData } from "@/components/home/v2/featured-trips-stack";

/**
 * lib/api/home2.ts — same DB-first / static-fallback swap point as
 * `lib/api/home.ts`, but for Homepage 2.0's own singleton (`HomepageV2Model`).
 * `app/page.tsx` calls this only when Site Settings' `activeHomepageVersion`
 * is `"v2"`. Kept separate from `lib/api/home.ts` on purpose — v1 and v2
 * content are independent, so editing one in the Admin Panel never affects
 * what the other renders once you switch back.
 */

export interface ResolvedHomepageV2Hero {
  eyebrow?: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  /** Falls back to imageUrl/imageAlt when no dedicated mobile crop is set. */
  imageMobileUrl?: string;
  imageMobileAlt?: string;
}

export interface ResolvedHomepageV2 {
  hero: ResolvedHomepageV2Hero;
  quickLinks: QuickLinkItem[];
  featuredTrips: FeaturedTripCardData[];
  source: "database" | "static";
}

const FALLBACK_HERO: ResolvedHomepageV2Hero = {
  eyebrow: "Journeys that stay with you",
  heading: "Find your pace in India.",
  subheading: "Curated trips, offbeat experiences and memories that last a lifetime.",
  ctaLabel: "Explore Trips",
  ctaHref: "/trips",
  imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2000&auto=format&fit=crop",
  imageAlt: "Grand Rajasthan palace on a lake at golden hour",
};

const FALLBACK_QUICK_LINKS: QuickLinkItem[] = [
  {
    variant: "featured",
    tag: "Featured",
    title: "Explore Trips",
    href: "/trips",
    imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800&auto=format&fit=crop",
    imageAlt: "Illuminated palace reflected in a lake at dusk",
  },
  {
    variant: "icon",
    icon: "Bus",
    title: "Transport",
    description: "Where every journey begins and takes you further.",
    href: "/transport",
  },
  {
    variant: "icon",
    icon: "MapPinned",
    title: "Destinations",
    description: "Explore top destinations and hidden gems across India.",
    href: "/destinations",
  },
  {
    variant: "image",
    title: "Hotels",
    href: "/hotels",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
    imageAlt: "Beachfront hotel pool at sunset",
  },
  {
    variant: "image",
    title: "Offers",
    href: "/offers",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    imageAlt: "Desert dunes at sunset",
  },
  {
    variant: "icon",
    icon: "Route",
    title: "Build Your Itinerary",
    description: "Customise your perfect trip, your way.",
    href: "/itinerary",
    wide: true,
  },
];

const FALLBACK_FEATURED_TRIPS: FeaturedTripCardData[] = [
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

function tripToFeaturedCardV2(
  trip: Trip,
  override: { tag?: string; tagTone?: "brass" | "teal" | "stone" }
): FeaturedTripCardData {
  const hasCover = trip.coverImage?.url && !trip.coverImage.isPlaceholder;
  return {
    id: trip.slug,
    tag: override.tag || trip.destinationName,
    tagTone: override.tagTone ?? "brass",
    title: trip.title,
    description: trip.shortDescription,
    imageUrl: hasCover ? trip.coverImage.url : FALLBACK_FEATURED_TRIPS[0].imageUrl,
    imageAlt: hasCover ? trip.coverImage.alt || trip.title : trip.title,
    href: `/trips/${trip.slug}`,
  };
}

export async function getResolvedHomepage2(): Promise<ResolvedHomepageV2> {
  if (!isDatabaseConfigured()) {
    return { hero: FALLBACK_HERO, quickLinks: FALLBACK_QUICK_LINKS, featuredTrips: FALLBACK_FEATURED_TRIPS, source: "static" };
  }

  try {
    await connectToDatabase();
    const doc = (await HomepageV2Model.findOne().lean()) as (HomepageV2Document & { _id: unknown }) | null;
    if (!doc) {
      return { hero: FALLBACK_HERO, quickLinks: FALLBACK_QUICK_LINKS, featuredTrips: FALLBACK_FEATURED_TRIPS, source: "static" };
    }

    // Hero — DB content only counts once a heading has actually been set;
    // an empty admin-created singleton must not render a blank hero.
    type ImgLike = { url?: string; alt?: string; isPlaceholder?: boolean } | undefined;
    const heroImgDesktop = doc.hero?.imageDesktop as ImgLike;
    const heroImgMobile = doc.hero?.imageMobile as ImgLike;
    const hero: ResolvedHomepageV2Hero =
      doc.hero?.heading
        ? {
            eyebrow: FALLBACK_HERO.eyebrow,
            heading: doc.hero.heading,
            subheading: doc.hero.subheading || FALLBACK_HERO.subheading,
            ctaLabel: doc.hero.ctaLabel || FALLBACK_HERO.ctaLabel,
            ctaHref: doc.hero.ctaHref || FALLBACK_HERO.ctaHref,
            imageUrl: heroImgDesktop?.url && !heroImgDesktop.isPlaceholder ? heroImgDesktop.url : FALLBACK_HERO.imageUrl,
            imageAlt: heroImgDesktop?.alt || FALLBACK_HERO.imageAlt,
            imageMobileUrl: heroImgMobile?.url && !heroImgMobile.isPlaceholder ? heroImgMobile.url : undefined,
            imageMobileAlt: heroImgMobile?.alt || undefined,
          }
        : FALLBACK_HERO;

    // Quick links — DB content only counts once at least one enabled link
    // exists; otherwise keep the reference layout intact.
    const enabledLinks = (doc.quickLinks ?? [])
      .filter((l) => l.enabled)
      .sort((a, b) => a.order - b.order);
    const quickLinks: QuickLinkItem[] =
      enabledLinks.length > 0
        ? enabledLinks.map((l) => {
            const img = l.image as ImgLike;
            const gallery = (l.gallery ?? [])
              .filter((g) => g.title || (g.image as ImgLike)?.url)
              .map((g) => {
                const gImg = g.image as ImgLike;
                return {
                  imageUrl: gImg?.url && !gImg.isPlaceholder ? gImg.url : "",
                  imageAlt: gImg?.alt || g.title,
                  title: g.title,
                };
              })
              .filter((g) => g.imageUrl);
            return {
              title: l.title,
              href: l.href,
              variant: l.variant,
              icon: l.variant === "icon" ? l.icon : undefined,
              imageUrl: img?.url && !img.isPlaceholder ? img.url : undefined,
              imageAlt: img?.alt || l.title,
              gallery: gallery.length > 0 ? gallery : undefined,
              tag: l.tag || undefined,
              description: l.description || undefined,
              wide: l.wide,
            };
          })
        : FALLBACK_QUICK_LINKS;

    // Featured trips — resolve chosen slugs against the real Trip
    // collection; fall back to "trip marked featured", then static seed.
    const chosen = (doc.featuredTrips ?? []).filter((f) => f.enabled);
    let featuredTrips: FeaturedTripCardData[] = [];
    if (chosen.length > 0) {
      const resolved = await Promise.all(chosen.map((f) => getTripBySlug(f.tripSlug)));
      featuredTrips = resolved
        .map((trip, i) => (trip ? tripToFeaturedCardV2(trip, chosen[i]) : null))
        .filter((t): t is FeaturedTripCardData => Boolean(t));
    }
    if (featuredTrips.length === 0) {
      const dbFeatured = await getStaticFeaturedFallback();
      featuredTrips =
        dbFeatured.length > 0
          ? dbFeatured.map((trip) => tripToFeaturedCardV2(trip, {}))
          : FALLBACK_FEATURED_TRIPS;
    }

    return { hero, quickLinks, featuredTrips, source: "database" };
  } catch (err) {
    console.error("[getResolvedHomepage2] MongoDB unreachable, falling back to static Homepage 2.0 content:", err);
    return { hero: FALLBACK_HERO, quickLinks: FALLBACK_QUICK_LINKS, featuredTrips: FALLBACK_FEATURED_TRIPS, source: "static" };
  }
}
