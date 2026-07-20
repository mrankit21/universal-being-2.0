/**
 * Phase 4.7 — Destinations Migration.
 * Reads the existing static registry (data/destinations/*.ts, 8 destinations)
 * and upserts each one into MongoDB by `slug`. Idempotent — safe to re-run.
 *
 * Run: npx tsx scripts/seed-destinations.ts
 */
import { destinationRegistry, destinationSlugs } from "../data/destinations";
import { DestinationModel } from "../lib/db/models";
import { connect, disconnect } from "./seed-utils";

async function main() {
  await connect();

  let created = 0;
  let updated = 0;

  for (const slug of destinationSlugs) {
    const destination = destinationRegistry[slug];
    const result = (await DestinationModel.findOneAndUpdate(
      { slug },
      { $set: destination },
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

  console.log(`\n[seed-destinations] Done. Created: ${created}, Updated: ${updated}, Total: ${destinationSlugs.length}`);
  await disconnect();
}

main().catch((err) => {
  console.error("[seed-destinations] Failed:", err);
  process.exit(1);
});