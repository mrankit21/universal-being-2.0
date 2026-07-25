/**
 * ONE-TIME RECOVERY — run once to restore data lost to the "whole-document
 * overwrite on save" bug (now fixed in trip-form.tsx / diffTripValue).
 *
 * Restores itinerary (and isCircuitParent where it was also wiped) for 4
 * trips, using the static registry as the source of truth:
 *
 *   DB slug                          <- static source slug
 *   udaipur-heritage-walk            <- udaipur-heritage-walk   (itinerary + isCircuitParent)
 *   spiti-valley-expedition          <- spiti-valley-expedition (itinerary + isCircuitParent)
 *   ladakh-himalayan                 <- ladakh-himalayan-circuit (itinerary + isCircuitParent — this
 *                                       trip's slug/title were renamed in Admin, which is why the
 *                                       automatic slug-match diagnostic couldn't find it)
 *   udaipur-weekend                  <- udaipur-flying-visit    (itinerary only — was never a
 *                                       circuit parent)
 *
 * Also seeds `spiti-quick-circuit`, which never made it into MongoDB at
 * all (confirmed separately, unrelated to the overwrite bug).
 *
 * Read current state, print a before/after diff, ask for confirmation-by-
 * flag before writing anything.
 *
 * Run (dry run, default):  npx tsx scripts/recover-lost-itineraries.ts
 * Run (actually writes):   npx tsx scripts/recover-lost-itineraries.ts --apply
 */
import { tripRegistry } from "../data/trips";
import { TripModel } from "../lib/db/models";
import { connect, disconnect } from "./seed-utils";

const RECOVERIES: { dbSlug: string; staticSlug: string; restoreCircuitParent: boolean }[] = [
  { dbSlug: "udaipur-heritage-walk", staticSlug: "udaipur-heritage-walk", restoreCircuitParent: true },
  { dbSlug: "spiti-valley-expedition", staticSlug: "spiti-valley-expedition", restoreCircuitParent: true },
  { dbSlug: "ladakh-himalayan", staticSlug: "ladakh-himalayan-circuit", restoreCircuitParent: true },
  { dbSlug: "udaipur-weekend", staticSlug: "udaipur-flying-visit", restoreCircuitParent: false },
];

async function main() {
  const apply = process.argv.includes("--apply");
  await connect();

  console.log(apply ? "APPLY MODE — writes will happen.\n" : "DRY RUN — no writes will happen (pass --apply to actually save).\n");

  for (const { dbSlug, staticSlug, restoreCircuitParent } of RECOVERIES) {
    const doc = await TripModel.findOne({ slug: dbSlug });
    const source = tripRegistry[staticSlug];

    console.log("=".repeat(80));
    console.log(`DB trip: ${dbSlug}`);

    if (!doc) {
      console.log(`  SKIPPED — not found in MongoDB.`);
      continue;
    }
    if (!source) {
      console.log(`  SKIPPED — static source "${staticSlug}" not found in registry.`);
      continue;
    }

    const currentDays = Array.isArray(doc.itinerary) ? doc.itinerary.length : 0;
    const sourceDays = source.itinerary?.length ?? 0;
    console.log(`  itinerary: ${currentDays} day(s) -> restoring ${sourceDays} day(s) from "${staticSlug}"`);
    if (restoreCircuitParent) {
      console.log(`  isCircuitParent: ${doc.isCircuitParent} -> true`);
    }

    // The same overwrite that wiped itinerary also wiped other admin-owned
    // text fields on at least one trip (shortDescription/fullDescription
    // came back empty and only surfaced via a full-document validation
    // error on .save()). Restore any of these from the static source too,
    // but ONLY if currently empty — never clobber real admin-written copy
    // that happens to differ from the static placeholder text.
    const textFieldsToCheck = ["shortDescription", "fullDescription"] as const;
    for (const field of textFieldsToCheck) {
      const currentVal = (doc as unknown as Record<string, unknown>)[field];
      const sourceVal = (source as unknown as Record<string, unknown>)[field];
      const isEmpty = typeof currentVal !== "string" || currentVal.trim() === "";
      if (isEmpty && typeof sourceVal === "string" && sourceVal.trim() !== "") {
        console.log(`  ${field}: EMPTY -> restoring from static source`);
        (doc as unknown as Record<string, unknown>)[field] = sourceVal;
      }
    }

    if (apply) {
      doc.itinerary = source.itinerary as typeof doc.itinerary;
      if (restoreCircuitParent) doc.isCircuitParent = true;
      try {
        await doc.save();
        console.log(`  ✔ Saved.`);
      } catch (err) {
        // Don't let one trip's validation error abort the rest of the
        // batch — report it and move on so the other 3 trips still get
        // fixed in this same run.
        console.log(`  ✘ FAILED TO SAVE: ${err instanceof Error ? err.message : err}`);
        console.log(`    (skipped — fix this trip manually, other trips in this run were not affected)`);
      }
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("spiti-quick-circuit — never seeded into MongoDB at all");
  const existingSpitiQuick = await TripModel.findOne({ slug: "spiti-quick-circuit" });
  if (existingSpitiQuick) {
    console.log("  Already exists in DB now — nothing to do.");
  } else {
    const source = tripRegistry["spiti-quick-circuit"];
    if (!source) {
      console.log("  SKIPPED — not found in static registry either.");
    } else {
      console.log(`  Will insert fresh from static registry (${source.itinerary?.length ?? 0} itinerary days).`);
      if (apply) {
        try {
          await TripModel.create(source);
          console.log("  ✔ Created.");
        } catch (err) {
          console.log(`  ✘ FAILED TO CREATE: ${err instanceof Error ? err.message : err}`);
        }
      }
    }
  }

  if (!apply) {
    console.log("\nNothing was written. Re-run with --apply once this looks correct:");
    console.log("  npx tsx scripts/recover-lost-itineraries.ts --apply");
  }

  await disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
