/**
 * Seeds MongoDB's singleton `homepage` document from the static seed data
 * in `data/home/*.ts` — hero slides, featured trips, and CTA/promo
 * defaults, matching the shape `lib/api/home.ts`'s `getResolvedHomepage()`
 * already knows how to read.
 *
 * IMPORTANT — run this AFTER `seed:trips` and `seed:testimonials`:
 *  - `featuredTrips` references real trip slugs by design, NOT the slugs in
 *    `data/home/featured-trips.ts` ("rajasthan-royals",
 *    "himalayan-winter-trail", etc.) — those don't exist in the real Trip
 *    catalog (`data/trips/*.ts`) and never did; they were homepage-only
 *    placeholder copy from before the real trip data layer was built.
 *    Instead this script uses whichever real trips are marked
 *    `featured: true` today (currently: Ladakh, Manali, Spiti, Udaipur).
 *  - `testimonialIds` references whatever's in the `testimonials` MongoDB
 *    collection at the time this script runs, so it must exist first.
 *
 * Idempotent: upserts the single Homepage document (there's only ever one).
 *
 * Usage: npm run seed:homepage   (after seed:trips and seed:testimonials)
 */
import mongoose from "mongoose";
import { connectForSeed, printSummary, type SeedSummary } from "./seed-utils";
import { HomepageModel, TestimonialModel, TripModel, type HomepageSectionKey } from "../lib/db/models";
import { heroSlides as staticHeroSlides } from "../data/home/hero-slides";

const SCRIPT = "seed-homepage";

const DEFAULT_SECTION_ORDER: HomepageSectionKey[] = [
  "hero",
  "featuredTrips",
  "themeExplorer",
  "valueProps",
  "testimonials",
  "promoBanner",
  "cta",
];

const DEFAULT_SECTION_VISIBILITY = {
  hero: true,
  featuredTrips: true,
  themeExplorer: true,
  valueProps: true,
  testimonials: true,
  cta: true,
};

async function main() {
  await connectForSeed(SCRIPT);

  // Hero slides: map data/home/hero-slides.ts's field names onto the
  // HomepageModel's HeroSlideDoc shape (eyebrow -> destinationLabel,
  // href -> ctaHref; no `image`/`badges` fields exist on HeroSlideDoc, so
  // those are dropped, same as lib/api/home.ts's own static-fallback mapping).
  const heroSlides = staticHeroSlides.map((s, i) => ({
    destinationLabel: s.eyebrow,
    heading: s.heading,
    subtitle: s.subtitle,
    ctaLabel: s.ctaLabel,
    ctaHref: s.href,
    overlayOpacity: 0.45,
    order: i,
    enabled: true,
    themeKey: s.themeKey,
  }));

  // Featured trips: use real trips marked `featured: true` in the Trip
  // collection (seeded by seed:trips), NOT data/home/featured-trips.ts's
  // slugs — see file header.
  const featuredTripDocs = await TripModel.find({ status: "published", featured: true })
    .select("slug")
    .lean();
  const featuredTrips = featuredTripDocs.map((t) => ({ tripSlug: t.slug, enabled: true }));
  if (featuredTrips.length === 0) {
    console.warn(
      `[${SCRIPT}] No trips with featured:true found in MongoDB — did you run "npm run seed:trips" first? Homepage will fall back to its own static featured-trips list until some trips are marked featured.`
    );
  }

  // Testimonials: reference whatever's already in the Testimonial
  // collection (seeded by seed:testimonials).
  const testimonialDocs = await TestimonialModel.find({ published: true }).select("_id").lean();
  const testimonialIds = testimonialDocs.map((t) => String(t._id));
  if (testimonialIds.length === 0) {
    console.warn(
      `[${SCRIPT}] No testimonials found in MongoDB — did you run "npm run seed:testimonials" first? Homepage will fall back to its own static testimonials list until some exist.`
    );
  }

  const existing = await HomepageModel.findOne().select("_id").lean();

  await HomepageModel.findOneAndUpdate(
    {},
    {
      $set: {
        heroSlides,
        featuredTrips,
        testimonialIds,
        promoBanner: { enabled: false, heading: "", body: "" },
        ctaSection: {
          heading: "Ready for your next trip?",
          body: "Tell us where you're leaning and we'll help you pick the right departure — no pressure, just a real conversation.",
          ctaLabel: "Book now",
          ctaHref: "/trips",
        },
        sectionOrder: DEFAULT_SECTION_ORDER,
        sectionVisibility: DEFAULT_SECTION_VISIBILITY,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const summary: SeedSummary = existing
    ? { created: 0, updated: 1, total: 1 }
    : { created: 1, updated: 0, total: 1 };
  printSummary(SCRIPT, summary);
}

main()
  .catch((err) => {
    console.error(`[${SCRIPT}] Failed:`, err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());