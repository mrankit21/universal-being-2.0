/**
 * Read-only diagnostic — flags any Circuit Group with MORE THAN ONE Trip
 * flagged `isCircuitParent: true`. Only one per group should ever be
 * flagged — two flagged Trips means the site picks whichever one MongoDB
 * happens to return first (not guaranteed), which caused parent/cover
 * images to randomly disappear on Udaipur and Ladakh (25-26 Jul 2026).
 * Makes ZERO writes.
 *
 * Run: npx tsx scripts/diagnostics/check-circuit-parents.ts
 */
import { TripModel } from "../../lib/db/models";
import { connect, disconnect } from "../seed-utils";

async function main() {
  await connect();

  const parents = await TripModel.find({ isCircuitParent: true, circuitGroup: { $exists: true, $ne: "" } })
    .select("slug title circuitGroup")
    .lean();

  const byGroup = new Map<string, { slug: string; title: string }[]>();
  for (const doc of parents) {
    const group = doc.circuitGroup as string;
    const list = byGroup.get(group) ?? [];
    list.push({ slug: doc.slug as string, title: doc.title as string });
    byGroup.set(group, list);
  }

  let foundIssue = false;
  console.log(`\nChecked ${byGroup.size} Circuit Group(s) with a flagged parent.\n`);
  for (const [group, trips] of byGroup) {
    if (trips.length > 1) {
      foundIssue = true;
      console.log(`⚠ "${group}" has ${trips.length} Circuit Parents flagged (should be 1):`);
      for (const t of trips) console.log(`   - ${t.title} (${t.slug})`);
    } else {
      console.log(`OK   "${group}" -> ${trips[0].title} (${trips[0].slug})`);
    }
  }

  if (!foundIssue) console.log("\n✔ No duplicate Circuit Parents found.");
  else console.log('\nFix in Admin Panel: open each extra Trip above and turn "Mark as Circuit Parent" OFF, leaving only one per group.');

  await disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
