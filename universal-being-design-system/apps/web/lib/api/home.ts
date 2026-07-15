import type { ThemeKey } from "@/types/theme";
import type { Trip } from "@/types/trip";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { HomepageModel, TestimonialModel, type HomepageSectionKey, type HomepageDocument } from "@/lib/db/models";
import { getTripBySlug, getFeaturedTrips as getStaticFeaturedFallback } from "@/lib/api/trips";
import { heroSlides as staticHeroSlides } from "@/data/home/hero-slides";
import { featuredTrips as staticFeaturedTrips, type HomeTripSummary } from "@/data/home/featured-trips";
import { testimonials as staticTestimonials, type Testimonial } from "@/data/home/testimonials";

/**
 * lib/api/home.ts — Step 7.6C-B Part 1: the same DB-first / static-fallback
 * swap point `lib/api/trips.ts` and `lib/api/destinations.ts` already
 * establish, applied to the homepage. `app/page.tsx` (a Server Component)
 * calls `getResolvedHomepage()` once and passes the result down as props —
 * no homepage section fetches its own data or talks to MongoDB directly,
 * and this file is the ONLY place that decides "database or seed data."
 *
 * Rule enforced here: MongoDB is read first; `data/home/*.ts` is used only
 * when the database isn't configured, or a given section's DB content is
 * empty (fresh install, nothing configured in the Admin Panel yet).
 */

export interface ResolvedHeroSlide {
  themeKey: ThemeKey;
  eyebrow: string;
  heading: string;
  subtitle: string;
  href: string;
  ctaLabel: string;
  badges: string[];
  image?: { url: string; alt: string; isPlaceholder: boolean };
  overlayOpacity: number;
}

export interface ResolvedPromoBanner {
  enabled: boolean;
  heading: string;
  body: string;
  image?: { url: string; alt: string; isPlaceholder: boolean };
  ctaLabel?: string;
  ctaHref?: string;
}

export interface ResolvedCtaSection {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundImage?: { url: string; alt: string; isPlaceholder: boolean };
}

export interface ResolvedHomepage {
  heroSlides: ResolvedHeroSlide[];
  featuredTrips: HomeTripSummary[];
  testimonials: Testimonial[];
  promoBanner: ResolvedPromoBanner;
  ctaSection: ResolvedCtaSection;
  sectionOrder: HomepageSectionKey[];
  sectionVisibility: Record<Exclude<HomepageSectionKey, "promoBanner">, boolean>;
  /** True when this response came from MongoDB rather than the static
   * `data/home/*.ts` fallback — surfaced for admin/debug use only. */
  source: "database" | "static";
}

const DEFAULT_SECTION_ORDER: HomepageSectionKey[] = [
  "hero",
  "featuredTrips",
  "themeExplorer",
  "valueProps",
  "testimonials",
  "promoBanner",
  "cta",
];

const DEFAULT_SECTION_VISIBILITY: Record<Exclude<HomepageSectionKey, "promoBanner">, boolean> = {
  hero: true,
  featuredTrips: true,
  themeExplorer: true,
  valueProps: true,
  testimonials: true,
  cta: true,
};

const DEFAULT_CTA_SECTION: ResolvedCtaSection = {
  heading: "Ready for your next trip?",
  body: "Tell us where you're leaning and we'll help you pick the right departure — no pressure, just a real conversation.",
  ctaLabel: "Book now",
  ctaHref: "/trips",
};

function staticHeroSlidesResolved(): ResolvedHeroSlide[] {
  return staticHeroSlides.map((s) => ({
    themeKey: s.themeKey,
    eyebrow: s.eyebrow,
    heading: s.heading,
    subtitle: s.subtitle,
    href: s.href,
    ctaLabel: s.ctaLabel,
    badges: s.badges,
    overlayOpacity: 0.45,
  }));
}

function tripToHomeSummary(trip: Trip): HomeTripSummary {
  return {
    slug: trip.slug,
    title: trip.title,
    location: trip.destinationName,
    themeKey: trip.themeKey,
    durationLabel: trip.duration.label,
    groupSizeLabel: `${trip.groupSize.min}–${trip.groupSize.max} people`,
    rating: trip.rating,
    reviewCount: trip.reviewCount,
    price: trip.price.discounted ?? trip.price.base,
    originalPrice: trip.price.discounted ? trip.price.base : undefined,
    seatsLeft: trip.availableSeats,
  };
}

export function testimonialDocToEntity(doc: {
  _id: unknown;
  authorName: string;
  quote: string;
  rating: number;
  tripSlug?: string;
}): Testimonial {
  return {
    id: String(doc._id),
    name: doc.authorName,
    trip: doc.tripSlug ? doc.tripSlug.replace(/-/g, " ") : "",
    quote: doc.quote,
    rating: doc.rating,
  };
}

/** Full static fallback — used when the database isn't configured at all. */
function staticHomepage(): ResolvedHomepage {
  return {
    heroSlides: staticHeroSlidesResolved(),
    featuredTrips: staticFeaturedTrips,
    testimonials: staticTestimonials,
    promoBanner: { enabled: false, heading: "", body: "" },
    ctaSection: DEFAULT_CTA_SECTION,
    sectionOrder: DEFAULT_SECTION_ORDER,
    sectionVisibility: DEFAULT_SECTION_VISIBILITY,
    source: "static",
  };
}

/**
 * Resolves everything the homepage needs to render, in one call:
 * hero slides, featured trips (real Trip docs, resolved from the slugs the
 * admin chose), testimonials (real Testimonial docs), promo banner, CTA
 * section, and section order/visibility. DB-first; static per-section
 * fallback when a section's DB content is empty.
 */
export async function getResolvedHomepage(): Promise<ResolvedHomepage> {
  if (!isDatabaseConfigured()) return staticHomepage();

  await connectToDatabase();
  const doc = (await HomepageModel.findOne().lean()) as (HomepageDocument & { _id: unknown }) | null;

  if (!doc) return staticHomepage();

  // Hero slides — DB slides (enabled only, in `order`) or static fallback.
  const dbSlides = (doc.heroSlides ?? [])
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((s): ResolvedHeroSlide => {
      const img = s.image as { url?: string; alt?: string; isPlaceholder?: boolean } | undefined;
      return {
        themeKey: (s.themeKey || "brand") as ThemeKey,
        eyebrow: s.destinationLabel,
        heading: s.heading,
        subtitle: s.subtitle,
        href: s.ctaHref,
        ctaLabel: s.ctaLabel,
        badges: [],
        overlayOpacity: s.overlayOpacity ?? 0.45,
        image: img?.url && !img.isPlaceholder ? { url: img.url, alt: img.alt ?? "", isPlaceholder: false } : undefined,
      };
    });
  const heroSlides = dbSlides.length > 0 ? dbSlides : staticHeroSlidesResolved();

  // Featured trips — resolve chosen (enabled) slugs against the real Trip
  // collection, preserving admin-chosen order; static fallback if empty.
  const chosenSlugs = (doc.featuredTrips ?? []).filter((f) => f.enabled).map((f) => f.tripSlug);
  let featuredTrips: HomeTripSummary[] = [];
  if (chosenSlugs.length > 0) {
    const resolved = await Promise.all(chosenSlugs.map((slug) => getTripBySlug(slug)));
    featuredTrips = resolved.filter((t): t is Trip => Boolean(t)).map(tripToHomeSummary);
  }
  if (featuredTrips.length === 0) {
    // Nothing chosen in the Admin Panel yet — fall back to whichever real
    // trips are marked `featured: true`, then static seed data as a last resort.
    const dbFeatured = await getStaticFeaturedFallback();
    featuredTrips = dbFeatured.length > 0 ? dbFeatured.map(tripToHomeSummary) : staticFeaturedTrips;
  }

  // Testimonials — resolve chosen IDs against the real Testimonial
  // collection, preserving order; static fallback if empty.
  const chosenIds = doc.testimonialIds ?? [];
  let testimonials: Testimonial[] = [];
  if (chosenIds.length > 0) {
    const docs = await TestimonialModel.find({ _id: { $in: chosenIds }, published: true }).lean();
    const byId = new Map(docs.map((d) => [String(d._id), d]));
    testimonials = chosenIds.map((id) => byId.get(id)).filter(Boolean).map((d) => testimonialDocToEntity(d!));
  }
  if (testimonials.length === 0) testimonials = staticTestimonials;

  const promoBannerImg = doc.promoBanner?.image as { url?: string; alt?: string; isPlaceholder?: boolean } | undefined;
  const ctaImg = doc.ctaSection?.backgroundImage as { url?: string; alt?: string; isPlaceholder?: boolean } | undefined;

  return {
    heroSlides,
    featuredTrips,
    testimonials,
    promoBanner: {
      enabled: Boolean(doc.promoBanner?.enabled),
      heading: doc.promoBanner?.heading ?? "",
      body: doc.promoBanner?.body ?? "",
      ctaLabel: doc.promoBanner?.ctaLabel,
      ctaHref: doc.promoBanner?.ctaHref,
      image: promoBannerImg?.url && !promoBannerImg.isPlaceholder ? { url: promoBannerImg.url, alt: promoBannerImg.alt ?? "", isPlaceholder: false } : undefined,
    },
    ctaSection: {
      heading: doc.ctaSection?.heading || DEFAULT_CTA_SECTION.heading,
      body: doc.ctaSection?.body || DEFAULT_CTA_SECTION.body,
      ctaLabel: doc.ctaSection?.ctaLabel || DEFAULT_CTA_SECTION.ctaLabel,
      ctaHref: doc.ctaSection?.ctaHref || DEFAULT_CTA_SECTION.ctaHref,
      backgroundImage: ctaImg?.url && !ctaImg.isPlaceholder ? { url: ctaImg.url, alt: ctaImg.alt ?? "", isPlaceholder: false } : undefined,
    },
    sectionOrder: doc.sectionOrder?.length ? doc.sectionOrder : DEFAULT_SECTION_ORDER,
    sectionVisibility: { ...DEFAULT_SECTION_VISIBILITY, ...(doc.sectionVisibility ?? {}) },
    source: "database",
  };
}
