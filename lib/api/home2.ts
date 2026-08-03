import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { HomepageV2Model, type HomepageV2Document } from "@/lib/db/models";
import { getTripBySlug, getFeaturedTrips as getStaticFeaturedFallback } from "@/lib/api/trips";
import { getSiteSettings } from "@/lib/api/site-settings";
import { getPublishedTrip2CardBySlug, getPublishedTrip2Trips, type Trip2CardSummary } from "@/lib/api/trip2";
import type { Trip } from "@/types/trip";
import type { QuickLinkItem } from "@/components/home/v2/floating-quick-links";
import type { FeaturedTripCardData } from "@/components/home/v2/featured-trips-stack";
import type { FunFactCardData } from "@/components/home/v2/fun-facts-zigzag";
import type { ResolvedSectionBackground } from "@/lib/api/home";

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

export interface ResolvedFindDestination {
  enabled: boolean;
  heading: string;
  body: string;
  background: ResolvedSectionBackground;
}

export interface ResolvedHomepageV2 {
  hero: ResolvedHomepageV2Hero;
  quickLinks: QuickLinkItem[];
  featuredTrips: FeaturedTripCardData[];
  /** Optional full-bleed background behind the whole Featured Trips
   * section — distinct from each card's own cover image. */
  featuredTripsSection: ResolvedSectionBackground;
  /** "Find your destination" banner right under Featured Trips. */
  findDestination: ResolvedFindDestination;
  funFacts: FunFactCardData[];
  /** Optional full-bleed background behind the whole Fun Facts section —
   * same pattern as `featuredTripsSection`. */
  funFactsSection: ResolvedSectionBackground;
  /** Where Featured Trips' "See all trips" link points — `/trip2` when
   * Site Settings' "Trips Version" is forced to "v2", `/trips` otherwise.
   * Computed here (not hardcoded in the component) so it always tracks
   * the same `activeTripsVersion` toggle Featured Trips itself resolves
   * against below. */
  seeAllHref: string;
  source: "database" | "static";
}

const DEFAULT_FEATURED_TRIPS_SECTION: ResolvedSectionBackground = { overlayOpacity: 0.6 };
const DEFAULT_FUN_FACTS_SECTION: ResolvedSectionBackground = { overlayOpacity: 0.6 };
const DEFAULT_FIND_DESTINATION: ResolvedFindDestination = {
  enabled: true,
  heading: "Find your destination",
  body: "Your next adventure is waiting. Discover amazing places with Universal Being.",
  background: { overlayOpacity: 0.5 },
};

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

const FALLBACK_FUN_FACTS: FunFactCardData[] = [
  {
    id: "royal-heritage",
    icon: "Mountain",
    title: "Royal Heritage",
    body: "Rajasthan is home to over 200 forts, more than any other state in India.",
    learnMoreHref: "/destinations",
  },
  {
    id: "highest-motorable",
    icon: "Sun",
    title: "Highest Motorable Roads",
    body: "Spiti Valley sits along some of the highest motorable passes on Earth.",
    learnMoreHref: "/destinations",
  },
  {
    id: "coastline",
    icon: "Globe",
    title: "2,500 Years of Trade",
    body: "Goa's coastline has welcomed traders and travellers for over two millennia.",
    learnMoreHref: "/destinations",
  },
];

type CoverImageOverride = { url?: string; alt?: string; isPlaceholder?: boolean } | undefined;

function tripToFeaturedCardV2(
  trip: Trip,
  override: { tag?: string; tagTone?: "brass" | "teal" | "stone"; coverImage?: CoverImageOverride }
): FeaturedTripCardData {
  // Homepage-only cover image override wins when set; otherwise fall back
  // to the trip's own cover photo, then the static placeholder.
  const overrideCover = override.coverImage;
  const hasOverrideCover = overrideCover?.url && !overrideCover.isPlaceholder;
  const hasCover = trip.coverImage?.url && !trip.coverImage.isPlaceholder;
  return {
    id: trip.slug,
    tag: override.tag || trip.destinationName,
    tagTone: override.tagTone ?? "brass",
    title: trip.title,
    description: trip.shortDescription,
    imageUrl: hasOverrideCover
      ? overrideCover!.url!
      : hasCover
        ? trip.coverImage.url
        : FALLBACK_FEATURED_TRIPS[0].imageUrl,
    imageAlt: hasOverrideCover
      ? overrideCover!.alt || trip.title
      : hasCover
        ? trip.coverImage.alt || trip.title
        : trip.title,
    href: `/trips/${trip.slug}`,
  };
}

/** Same card mapping as `tripToFeaturedCardV2`, but for a Trip 2.0 document
 * — links straight to `/trip2/[slug]` instead of the old `/trips/[slug]`.
 * Used for Featured Trips whenever Site Settings' "Trips Version" is
 * forced to "v2" (Trip 2.0 active site-wide), so the homepage's cards
 * always point at the live Trip 2.0 page rather than the old one. */
function trip2ToFeaturedCardV2(
  trip: Trip2CardSummary,
  override: { tag?: string; tagTone?: "brass" | "teal" | "stone"; coverImage?: CoverImageOverride }
): FeaturedTripCardData {
  const overrideCover = override.coverImage;
  const hasOverrideCover = overrideCover?.url && !overrideCover.isPlaceholder;
  const hasCover = trip.heroImage?.url && !trip.heroImage.isPlaceholder;
  return {
    id: trip.slug,
    tag: override.tag || trip.location,
    tagTone: override.tagTone ?? "brass",
    title: trip.title,
    description: trip.shortDescription,
    imageUrl: hasOverrideCover
      ? overrideCover!.url!
      : hasCover
        ? trip.heroImage!.url!
        : FALLBACK_FEATURED_TRIPS[0].imageUrl,
    imageAlt: hasOverrideCover
      ? overrideCover!.alt || trip.title
      : hasCover
        ? trip.heroImage!.alt || trip.title
        : trip.title,
    href: `/trip2/${trip.slug}`,
  };
}

export async function getResolvedHomepage2(): Promise<ResolvedHomepageV2> {
  if (!isDatabaseConfigured()) {
    return {
      hero: FALLBACK_HERO,
      quickLinks: FALLBACK_QUICK_LINKS,
      featuredTrips: FALLBACK_FEATURED_TRIPS,
      featuredTripsSection: DEFAULT_FEATURED_TRIPS_SECTION,
      findDestination: DEFAULT_FIND_DESTINATION,
      funFacts: FALLBACK_FUN_FACTS,
      funFactsSection: DEFAULT_FUN_FACTS_SECTION,
      seeAllHref: "/trips",
      source: "static",
    };
  }

  try {
    await connectToDatabase();
    // Fetched once up front — both the "no homepage doc yet" early return
    // and the real Featured Trips resolution below need to know whether
    // Trip 2.0 is active site-wide.
    const siteSettings = await getSiteSettings();
    const trip2Active = siteSettings.activeTripsVersion === "v2";
    const seeAllHref = trip2Active ? "/trip2" : "/trips";

    const doc = (await HomepageV2Model.findOne().lean()) as (HomepageV2Document & { _id: unknown }) | null;
    if (!doc) {
      return {
        hero: FALLBACK_HERO,
        quickLinks: FALLBACK_QUICK_LINKS,
        featuredTrips: FALLBACK_FEATURED_TRIPS,
        featuredTripsSection: DEFAULT_FEATURED_TRIPS_SECTION,
        findDestination: DEFAULT_FIND_DESTINATION,
        funFacts: FALLBACK_FUN_FACTS,
        funFactsSection: DEFAULT_FUN_FACTS_SECTION,
        seeAllHref,
        source: "static",
      };
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
    //
    // Trip 2.0 (2026-08): when Site Settings' "Trips Version" is forced
    // to "v2", every trip on the site should be Trip 2.0 — so Featured
    // Trips must never surface an old `/trips/[slug]` card here either.
    // In that mode, each admin-chosen slug is resolved against the Trip
    // 2.0 collection instead of the old Trip collection, and a slug with
    // no matching *published* Trip 2.0 page is dropped rather than
    // falling back to its old-Trip version. If that leaves nothing (none
    // of the chosen slugs have a Trip 2.0 page yet), fall back to every
    // published Trip 2.0 trip — still never the old collection.
    const chosen = (doc.featuredTrips ?? []).filter((f) => f.enabled) as Array<
      HomepageV2Document["featuredTrips"][number] & { coverImage?: CoverImageOverride }
    >;
    let featuredTrips: FeaturedTripCardData[] = [];

    if (trip2Active) {
      if (chosen.length > 0) {
        const resolved = await Promise.all(chosen.map((f) => getPublishedTrip2CardBySlug(f.tripSlug)));
        featuredTrips = resolved
          .map((trip, i) => (trip ? trip2ToFeaturedCardV2(trip, chosen[i]) : null))
          .filter((t): t is FeaturedTripCardData => Boolean(t));
      }
      if (featuredTrips.length === 0) {
        const allTrip2 = await getPublishedTrip2Trips();
        featuredTrips = allTrip2.map((trip) => trip2ToFeaturedCardV2(trip, {}));
      }
    } else {
      if (chosen.length > 0) {
        const resolved = await Promise.all(chosen.map((f) => getTripBySlug(f.tripSlug)));
        featuredTrips = resolved
          .map((trip, i) => (trip ? tripToFeaturedCardV2(trip, chosen[i]) : null))
          .filter((t): t is FeaturedTripCardData => Boolean(t));
      }
      if (featuredTrips.length === 0) {
        const dbFeatured = await getStaticFeaturedFallback();
        featuredTrips = dbFeatured.length > 0 ? dbFeatured.map((trip) => tripToFeaturedCardV2(trip, {})) : [];
      }
    }

    if (featuredTrips.length === 0) {
      featuredTrips = FALLBACK_FEATURED_TRIPS;
    }

    // Featured Trips section background — optional full-bleed backdrop
    // behind the whole section (distinct from each card's own cover
    // image). Unset/no image falls back to the plain section background,
    // same rule as v1's Why Travel With Us / Testimonials backgrounds.
    const ftsImg = doc.featuredTripsSection?.backgroundImage as ImgLike;
    const ftsImgMobile = doc.featuredTripsSection?.backgroundImageMobile as ImgLike;
    const featuredTripsSection: ResolvedSectionBackground = {
      backgroundImage: ftsImg?.url && !ftsImg.isPlaceholder ? { url: ftsImg.url, alt: ftsImg.alt ?? "", isPlaceholder: false } : undefined,
      backgroundImageMobile:
        ftsImgMobile?.url && !ftsImgMobile.isPlaceholder
          ? { url: ftsImgMobile.url, alt: ftsImgMobile.alt ?? "", isPlaceholder: false }
          : undefined,
      overlayOpacity: doc.featuredTripsSection?.overlayOpacity ?? DEFAULT_FEATURED_TRIPS_SECTION.overlayOpacity,
    };

    // Fun facts — same "DB content only counts once something is actually
    // enabled" rule as quick links, so an empty admin-created singleton
    // still shows the reference zigzag cards instead of an empty section.
    const enabledFunFacts = (doc.funFacts ?? [])
      .filter((f) => f.enabled && (f.title || f.body))
      .sort((a, b) => a.order - b.order);
    const funFacts: FunFactCardData[] =
      enabledFunFacts.length > 0
        ? enabledFunFacts.map((f, i) => ({
            id: `${i}-${f.title || "fact"}`,
            icon: f.icon,
            title: f.title,
            body: f.body,
            learnMoreHref: f.learnMoreHref || undefined,
          }))
        : FALLBACK_FUN_FACTS;

    // Fun Facts section background — same optional full-bleed backdrop
    // pattern as Featured Trips' section background above.
    const ffsImg = doc.funFactsSection?.backgroundImage as ImgLike;
    const ffsImgMobile = doc.funFactsSection?.backgroundImageMobile as ImgLike;
    const funFactsSection: ResolvedSectionBackground = {
      backgroundImage: ffsImg?.url && !ffsImg.isPlaceholder ? { url: ffsImg.url, alt: ffsImg.alt ?? "", isPlaceholder: false } : undefined,
      backgroundImageMobile:
        ffsImgMobile?.url && !ffsImgMobile.isPlaceholder
          ? { url: ffsImgMobile.url, alt: ffsImgMobile.alt ?? "", isPlaceholder: false }
          : undefined,
      overlayOpacity: doc.funFactsSection?.overlayOpacity ?? DEFAULT_FUN_FACTS_SECTION.overlayOpacity,
    };

    // "Find your destination" banner — heading + body over an optional
    // themed backdrop, same background pattern as the sections above.
    // DB content only counts once a heading has actually been set.
    const fdImg = doc.findDestination?.backgroundImage as ImgLike;
    const fdImgMobile = doc.findDestination?.backgroundImageMobile as ImgLike;
    const findDestination: ResolvedFindDestination = doc.findDestination?.heading
      ? {
          enabled: doc.findDestination.enabled ?? true,
          heading: doc.findDestination.heading,
          body: doc.findDestination.body || DEFAULT_FIND_DESTINATION.body,
          background: {
            backgroundImage:
              fdImg?.url && !fdImg.isPlaceholder ? { url: fdImg.url, alt: fdImg.alt ?? "", isPlaceholder: false } : undefined,
            backgroundImageMobile:
              fdImgMobile?.url && !fdImgMobile.isPlaceholder
                ? { url: fdImgMobile.url, alt: fdImgMobile.alt ?? "", isPlaceholder: false }
                : undefined,
            overlayOpacity: doc.findDestination?.overlayOpacity ?? DEFAULT_FIND_DESTINATION.background.overlayOpacity,
          },
        }
      : DEFAULT_FIND_DESTINATION;

    return { hero, quickLinks, featuredTrips, featuredTripsSection, findDestination, funFacts, funFactsSection, seeAllHref, source: "database" };
  } catch (err) {
    console.error("[getResolvedHomepage2] MongoDB unreachable, falling back to static Homepage 2.0 content:", err);
    return {
      hero: FALLBACK_HERO,
      quickLinks: FALLBACK_QUICK_LINKS,
      featuredTrips: FALLBACK_FEATURED_TRIPS,
      featuredTripsSection: DEFAULT_FEATURED_TRIPS_SECTION,
      findDestination: DEFAULT_FIND_DESTINATION,
      funFacts: FALLBACK_FUN_FACTS,
      funFactsSection: DEFAULT_FUN_FACTS_SECTION,
      seeAllHref: "/trips",
      source: "static",
    };
  }
}
