/**
 * Broader read-only diagnostic — the itinerary overwrite bug likely wiped
 * OTHER admin-owned content fields too (shortDescription/fullDescription
 * confirmed empty on udaipur-heritage-walk when .save() ran full
 * validation). This checks every trip in MongoDB for empty
 * shortDescription/fullDescription/highlights/inclusions/exclusions and
 * compares against the static registry, same shape as check-itineraries.ts.
 * Zero writes.
 *
 * Run: npx tsx scripts/check-trip-fields.ts
 */
import { tripRegistry } from "../data/trips";
import { TripModel } from "../lib/db/models";
import { connect, disconnect } from "./seed-utils";

const FIELDS_TO_CHECK = [
  "shortDescription",
  "fullDescription",
  "highlights",
  "inclusions",
  "exclusions",
] as const;

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

async function main() {
  await connect();
  const dbTrips = await TripModel.find({}).lean();
  console.log(`\nChecking ${dbTrips.length} trip(s) for empty content fields...\n`);

  let anyIssues = false;

  for (const doc of dbTrips) {
    const slug = doc.slug as string;
    const staticTrip = tripRegistry[slug];
    const emptyFields: string[] = [];

    for (const field of FIELDS_TO_CHECK) {
      const dbVal = (doc as Record<string, unknown>)[field];
      if (isEmpty(dbVal)) {
        const staticVal = staticTrip ? (staticTrip as unknown as Record<string, unknown>)[field] : undefined;
        const staticHasIt = !isEmpty(staticVal);
        emptyFields.push(`${field}${staticHasIt ? " (static has it — recoverable)" : " (no static fallback)"}`);
      }
    }

    if (emptyFields.length) {
      anyIssues = true;
      console.log(`⚠ ${slug}`);
      emptyFields.forEach((f) => console.log(`    - ${f}`));
    }
  }

  if (!anyIssues) {
    console.log("No empty content fields found on any trip currently in MongoDB. ✔");
  }

  await disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
