/**
 * Phase 4.6 — Trips Migration.
 * Reads the existing static registry (data/trips/*.ts, 7 trips) and upserts
 * each one into MongoDB by `slug`. Idempotent — running this twice never
 * creates duplicates; it just re-syncs the DB doc to match the static data.
 *
 * Run: npx tsx scripts/seed-trips.ts
 */
import { tripRegistry, tripSlugs } from "../data/trips";
import { TripModel } from "../lib/db/models";
import { connect, disconnect } from "./seed-utils";

async function main() {
  await connect();

  let created = 0;
  let updated = 0;

  for (const slug of tripSlugs) {
    const trip = tripRegistry[slug];
    // Mongoose will ignore/clean any stray client-only fields (like `id`)
    // that aren't in the TripSchema — safe to pass the whole object.
    const result = (await TripModel.findOneAndUpdate(
      { slug },
      { $set: trip },
      { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
    )) as unknown as { lastErrorObject?: { upserted?: boolean } };

    if (result?.lastErrorObject?.upserted) {
      created++;
      console.log(`  + created: ${slug}`);
    } else {
      updated++;
      console.log(`  ~ updated: ${slug}`);
    }
  }

  console.log(`\n[seed-trips] Done. Created: ${created}, Updated: ${updated}, Total: ${tripSlugs.length}`);
  await disconnect();
}

main().catch((err) => {
  console.error("[seed-trips] Failed:", err);
  process.exit(1);
});