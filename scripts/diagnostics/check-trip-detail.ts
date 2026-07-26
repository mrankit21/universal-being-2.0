/**
 * Targeted, read-only diagnostic for the Udaipur circuit (and any other
 * slugs you pass in) — dumps itinerary content + updatedAt/updatedBy so we
 * can see exactly when/who last touched the document that lost its
 * itinerary. Zero writes.
 *
 * Run: npx tsx scripts/check-trip-detail.ts udaipur-heritage-walk udaipur-flying-visit udaipur-kumbhalgarh-extension
 * (or with no args, it defaults to the Udaipur circuit)
 */
import { TripModel } from "../../lib/db/models";
import { connect, disconnect } from "../seed-utils";

async function main() {
  await connect();

  const slugs = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ["udaipur-heritage-walk", "udaipur-flying-visit", "udaipur-kumbhalgarh-extension"];

  for (const slug of slugs) {
    const doc = await TripModel.findOne({ slug }).lean();
    console.log("\n" + "=".repeat(80));
    console.log(`slug: ${slug}`);
    if (!doc) {
      console.log("  NOT FOUND in MongoDB at all.");
      continue;
    }
    console.log(`  _id: ${doc._id}`);
    console.log(`  title: ${doc.title}`);
    console.log(`  circuitGroup: ${doc.circuitGroup ?? "—"}  |  isCircuitParent: ${doc.isCircuitParent ?? false}`);
    console.log(`  status: ${doc.status}`);
    console.log(`  updatedAt: ${doc.updatedAt ?? "—"}`);
    console.log(`  updatedBy: ${(doc as unknown as Record<string, unknown>).updatedBy ?? "— (never PATCHed, or field not tracked at time of last save)"}`);
    console.log(`  createdAt: ${doc.createdAt ?? "—"}`);
    const itin = Array.isArray(doc.itinerary) ? doc.itinerary : [];
    console.log(`  itinerary days: ${itin.length}`);
    if (itin.length) {
      itin.forEach((d: Record<string, unknown>) =>
        console.log(`    - Day ${d.day}: ${d.title}`)
      );
    } else {
      console.log("    (EMPTY)");
    }
  }

  await disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
