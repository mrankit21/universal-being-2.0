/**
 * Read-only diagnostic — lists every Trip in MongoDB along with its
 * itinerary day-count, so you can see exactly which trips lost their
 * itinerary (0 days) vs which ones are fine. Makes ZERO writes to the
 * database — purely a report.
 *
 * Run: npx tsx scripts/check-itineraries.ts
 */
import { tripRegistry } from "../../data/trips";
import { TripModel } from "../../lib/db/models";
import { connect, disconnect } from "../seed-utils";

async function main() {
  await connect();

  const dbTrips = await TripModel.find({}).lean();

  console.log(`\nFound ${dbTrips.length} trip(s) in MongoDB.\n`);
  console.log(
    "slug".padEnd(36) + "DB itinerary days".padEnd(20) + "Static file days".padEnd(20) + "Status"
  );
  console.log("-".repeat(100));

  for (const doc of dbTrips) {
    const slug = doc.slug as string;
    const dbDays = Array.isArray(doc.itinerary) ? doc.itinerary.length : 0;
    const staticTrip = tripRegistry[slug];
    const staticDays = staticTrip?.itinerary?.length ?? "—";

    let status = "OK";
    if (dbDays === 0 && staticTrip && staticDays !== 0) {
      status = "⚠ MISSING — static file HAS itinerary, DB doesn't";
    } else if (dbDays === 0 && !staticTrip) {
      status = "⚠ MISSING — no static fallback either (admin-only trip)";
    }

    console.log(slug.padEnd(36) + String(dbDays).padEnd(20) + String(staticDays).padEnd(20) + status);
  }

  // Also flag static trips that were never migrated into MongoDB at all.
  const dbSlugs = new Set(dbTrips.map((d) => d.slug as string));
  const neverMigrated = Object.keys(tripRegistry).filter((slug) => !dbSlugs.has(slug));
  if (neverMigrated.length) {
    console.log(`\nStatic trips not found in DB at all (never seeded): ${neverMigrated.join(", ")}`);
  }

  await disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
