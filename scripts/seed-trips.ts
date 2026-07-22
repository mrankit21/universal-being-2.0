/**
 * Phase 4.6 — Trips Migration.
 * Reads the existing static registry (data/trips/*.ts, 7 trips) and upserts
 * each one into MongoDB by `slug`. Idempotent — running this twice never
 * creates duplicates; it just re-syncs the DB doc to match the static data.
 *
 * SAFE-MERGE (post-launch guard): once a trip has been edited from the
 * Admin Panel, editors own its content — the static seed file is only a
 * bootstrap starting point. Re-running this script must never clobber
 * admin-uploaded images or hand-written copy with the seed file's
 * placeholder/demo values. So for a trip that ALREADY EXISTS in the DB, we
 * only $set fields that are safe/structural to re-sync (e.g. circuitGroup,
 * destinationRoutes, or newly-added schema fields) and never touch content
 * fields an admin is expected to customize. New trips (first-time insert)
 * still get the full seed object, images included.
 *
 * Run: npx tsx scripts/seed-trips.ts
 */
import { tripRegistry, tripSlugs } from "../data/trips";
import { TripModel } from "../lib/db/models";
import { connect, disconnect } from "./seed-utils";

// Fields an admin is expected to customize per-trip after launch — never
// overwritten by the seed script once a trip document already exists.
const ADMIN_OWNED_FIELDS = [
  "heroImage",
  "heroImageMobile",
  "coverImage",
  "gallery",
  "title",
  "subtitle",
  "description",
  "itinerary",
  "price",
  "departureDates",
  "highlights",
  "inclusions",
  "exclusions",
  "faqs",
  "seo",
  "status",
  "featured",
] as const;

async function main() {
  await connect();

  let created = 0;
  let updated = 0;

  for (const slug of tripSlugs) {
    const trip = tripRegistry[slug] as unknown as Record<string, unknown>;
    const existing = await TripModel.findOne({ slug }).lean();

    let setPayload: Record<string, unknown> = trip;

    if (existing) {
      // Existing document — strip admin-owned fields out of the seed
      // payload so we only re-sync structural/new fields (e.g.
      // circuitGroup, destinationRoutes) and leave admin edits untouched.
      setPayload = Object.fromEntries(
        Object.entries(trip).filter(
          ([key]) => !ADMIN_OWNED_FIELDS.includes(key as typeof ADMIN_OWNED_FIELDS[number])
        )
      );
    }

    // Mongoose will ignore/clean any stray client-only fields (like `id`)
    // that aren't in the TripSchema — safe to pass the whole object.
    const result = (await TripModel.findOneAndUpdate(
      { slug },
      { $set: setPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
    )) as unknown as { lastErrorObject?: { upserted?: boolean } };

    if (result?.lastErrorObject?.upserted) {
      created++;
      console.log(`  + created: ${slug} (full seed data)`);
    } else {
      updated++;
      console.log(`  ~ updated: ${slug} (admin-owned fields preserved)`);
    }
  }

  console.log(
    `\n[seed-trips] Done. Created: ${created}, Updated: ${updated} (admin fields preserved), Total: ${tripSlugs.length}`
  );
  console.log(
    `[seed-trips] Note: images/content/pricing on already-existing trips are never touched by this script — edit those from the Admin Panel.`
  );
  await disconnect();
}

main().catch((err) => {
  console.error("[seed-trips] Failed:", err);
  process.exit(1);
});