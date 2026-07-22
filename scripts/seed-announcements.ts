/**
 * Seeds MongoDB's `announcements` collection from `data/layout/announcement.ts`.
 *
 * `activeAnnouncement` is seeded `enabled: true` (matches what's live on the
 * static site today). The entries in `announcementExamples` are seeded
 * `enabled: false` — they were reference examples, not live content, so
 * they land in the Admin Panel ready to toggle on instead of disappearing.
 *
 * Idempotent: upserts by `message` (Announcement has no slug field; message
 * text is unique across all 5 static entries and safe to re-run against).
 *
 * Usage: npm run seed:announcements
 */
import mongoose from "mongoose";
import { connectForSeed, printSummary, type SeedSummary } from "./seed-utils";
import { AnnouncementModel } from "../lib/db/models";
import { activeAnnouncement, announcementExamples } from "../data/layout/announcement";
import type { AnnouncementConfig } from "../types/layout";

const SCRIPT = "seed-announcements";

async function seedOne(config: AnnouncementConfig, enabled: boolean, summary: SeedSummary) {
  const existing = await AnnouncementModel.findOne({ message: config.message }).select("_id").lean();

  await AnnouncementModel.findOneAndUpdate(
    { message: config.message },
    {
      $set: {
        kind: config.kind,
        message: config.message,
        href: config.href,
        linkLabel: config.linkLabel,
        dismissible: config.dismissible,
        enabled,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (existing) {
    summary.updated += 1;
    console.log(`[${SCRIPT}] Updated: ${config.id} (enabled: ${enabled})`);
  } else {
    summary.created += 1;
    console.log(`[${SCRIPT}] Created: ${config.id} (enabled: ${enabled})`);
  }
}

async function main() {
  await connectForSeed(SCRIPT);

  const examples = Object.values(announcementExamples);
  const summary: SeedSummary = { created: 0, updated: 0, total: 1 + examples.length };

  if (activeAnnouncement) await seedOne(activeAnnouncement, true, summary);
  for (const example of examples) await seedOne(example, false, summary);

  printSummary(SCRIPT, summary);
}

main()
  .catch((err) => {
    console.error(`[${SCRIPT}] Failed:`, err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());