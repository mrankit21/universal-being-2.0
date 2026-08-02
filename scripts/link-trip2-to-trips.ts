/**
 * link-trip2-to-trips.ts
 *
 * Fixes the root cause of "Trip 2.0 nahin aa raha" — a Trip2 doc that has
 * no matching TripModel doc at the same slug is invisible: /trips/[slug]
 * calls getTripBySlug() FIRST and 404s before the v1/v2 redirect check
 * ever runs, and /trips listing only ever reads from TripModel.
 *
 * For every Trip2 document, this script:
 *   1. Checks whether a Trip already exists at that slug.
 *   2. If yes -> leaves it completely untouched (never overwrites admin content).
 *   3. If no  -> creates a new Trip doc, best-effort filled from the Trip2
 *      doc's own fields, with `status: "draft"` and `activeVersion: "v2"`.
 *
 * IMPORTANT: the created Trip is a DRAFT. It will now show up in
 * /admin/trips so you can open it in the real Trip Editor, fill in the
 * fields the Trip2 form doesn't have (destinationSlug, themeKey, pickup,
 * drop, vehicle, mapQuery, highlights...), double-check the auto-mapped
 * fields, and Publish. Once BOTH the Trip (status: published) and the
 * Trip2 page (status: published) are published, /trips/[slug] will
 * transparently redirect to /trip2/[slug] and it'll appear on /trips too.
 *
 * Run: npx tsx scripts/link-trip2-to-trips.ts
 */
import { TripModel, Trip2Model } from "../lib/db/models";
import { connect, disconnect, printSummary } from "./seed-utils";

// Known destinations — mirrors the exact destinationSlug/themeKey already
// used by the matching base trip in data/trips/*.ts, so the new Trip stays
// consistent with the rest of that destination's trips.
const DESTINATION_DEFAULTS: Record<string, { destinationSlug: string; destinationName: string; themeKey: string }> = {
  jibhi: { destinationSlug: "jibhi", destinationName: "Jibhi", themeKey: "forest" },
  dharamshala: { destinationSlug: "dharamshala", destinationName: "Dharamshala", themeKey: "forest" },
  udaipur: { destinationSlug: "udaipur", destinationName: "Udaipur", themeKey: "rajasthan" },
  manali: { destinationSlug: "manali", destinationName: "Manali", themeKey: "mountain" },
};

function guessDestination(slug: string, fallbackName: string) {
  const key = Object.keys(DESTINATION_DEFAULTS).find((k) => slug.startsWith(k));
  if (key) return DESTINATION_DEFAULTS[key];
  return { destinationSlug: slug.split("-")[0], destinationName: fallbackName || slug, themeKey: "mountain" };
}

async function main() {
  await connect("link-trip2-to-trips");

  const trip2Docs = await Trip2Model.find({}).lean();
  let created = 0;
  let skipped = 0;
  let failed = 0;

  // Placeholder ImageAsset — matches the schema's own defaults
  // (provider: "placeholder", isPlaceholder: true). Passing this instead
  // of `undefined` is required: `heroImage`/`coverImage`/`thumbnail`/
  // `homepageHeroImage` are required SUBDOCUMENT fields, so an
  // `undefined` value is treated as "field missing entirely" and fails
  // validation, even though the fields *inside* the subdocument all have
  // defaults. An empty object lets those inner defaults kick in.
  const PLACEHOLDER_IMAGE = { provider: "placeholder", url: "", alt: "", isPlaceholder: true };

  for (const t2 of trip2Docs) {
    // try/catch per trip so one bad/incomplete Trip2 doc can't stop the
    // rest of the batch from being created (this is what happened last
    // run — Dharamshala failing killed Udaipur + Manali too).
    try {
      const existing = await TripModel.findOne({ slug: t2.slug }).select("_id").lean();
      if (existing) {
        console.log(`[link-trip2-to-trips] Skipped (already linked): ${t2.slug}`);
        skipped++;
        continue;
      }

      const dest = guessDestination(t2.slug, t2.location);
      const gallery = (t2.gallery ?? []).map((g) => g.image).filter(Boolean);
      const heroImage = t2.heroImage || PLACEHOLDER_IMAGE;
      const batchDates = (t2.batchDates ?? []).map((b, i) => ({
        id: `${t2.slug}-batch-${i + 1}`,
        startDate: b.startDate,
        endDate: b.endDate,
        seatsTotal: b.seatsTotal ?? 0,
        seatsAvailable: b.seatsAvailable ?? 0,
        status: b.status === "sold-out" ? "sold-out" : b.status === "filling-fast" ? "filling-fast" : "open",
        isPublished: true,
      }));

      await TripModel.create({
        slug: t2.slug,
        title: t2.title || t2.slug,
        destinationSlug: dest.destinationSlug,
        destinationName: dest.destinationName,
        themeKey: dest.themeKey,
        shortDescription: t2.shortDescription || "",
        fullDescription: t2.shortDescription || "",
        heroImage,
        coverImage: heroImage,
        thumbnail: heroImage,
        homepageHeroImage: heroImage,
        gallery,
        duration: { days: 1, nights: 0, label: t2.durationLabel || "" },
        groupSize: { min: 2, max: 12 },
        price: {
          base: t2.price?.basePrice ?? 0,
          discounted: t2.price?.discountedPrice,
          bookingAmount: t2.price?.bookingAmount ?? 0,
          currency: "INR",
        },
        totalSeats: batchDates.reduce((sum, b) => sum + b.seatsTotal, 0),
        availableSeats: batchDates.reduce((sum, b) => sum + b.seatsAvailable, 0),
        departureDates: batchDates,
        inclusions: t2.inclusions || [],
        exclusions: t2.exclusions || [],
        itinerary: (t2.itinerary ?? []).map((d) => ({
          day: d.day,
          title: d.title,
          description: d.description,
          location: d.location,
          activities: [],
          meals: [],
          images: d.image ? [d.image] : [],
        })),
        faqs: (t2.faqs ?? []).map((f, i) => ({ id: `${t2.slug}-faq-${i + 1}`, question: f.question, answer: f.answer })),
        mapQuery: t2.location || "",
        status: "draft",
        activeVersion: "v2",
        isPlaceholderContent: true,
        seo: { title: t2.title || t2.slug, description: t2.shortDescription || "" },
      });

      console.log(`[link-trip2-to-trips] Created draft Trip for: ${t2.slug}`);
      created++;
    } catch (err) {
      console.error(`[link-trip2-to-trips] Failed for ${t2.slug}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  printSummary({ created, skipped, failed, total: trip2Docs.length });
  await disconnect();
}

main().catch((err) => {
  console.error("[link-trip2-to-trips] Failed:", err);
  process.exit(1);
});
