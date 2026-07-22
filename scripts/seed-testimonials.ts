/**
 * Seeds MongoDB's `testimonials` collection from the static seed data in
 * `data/home/testimonials.ts`.
 *
 * Idempotent: upserts by `authorName` + `quote` (Testimonial has no natural
 * slug/key of its own — this pair is unique enough for the 4 static
 * placeholders and safe to re-run).
 *
 * NOTE: the static testimonials reference trip titles ("Rajasthan Royals",
 * "Himalayan Winter Trail", "Goa Beach Reset", "Western Ghats Forest Trail")
 * that don't exist in the real Trip catalog (data/trips/*.ts) — they're
 * leftover placeholder copy from before the real trip data layer was built.
 * This script seeds the quotes as-is but leaves `tripSlug` unset rather than
 * guess a wrong mapping. Update these via the Admin Panel once you have
 * real reviews tied to real trips.
 *
 * Usage: npm run seed:testimonials
 */
import mongoose from "mongoose";
import { connectForSeed, printSummary, type SeedSummary } from "./seed-utils";
import { TestimonialModel } from "../lib/db/models";
import { testimonials as staticTestimonials } from "../data/home/testimonials";

const SCRIPT = "seed-testimonials";

async function main() {
  await connectForSeed(SCRIPT);

  const summary: SeedSummary = { created: 0, updated: 0, total: staticTestimonials.length };

  for (const t of staticTestimonials) {
    const existing = await TestimonialModel.findOne({ authorName: t.name, quote: t.quote })
      .select("_id")
      .lean();

    await TestimonialModel.findOneAndUpdate(
      { authorName: t.name, quote: t.quote },
      { $set: { authorName: t.name, quote: t.quote, rating: t.rating, published: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (existing) {
      summary.updated += 1;
      console.log(`[${SCRIPT}] Updated: ${t.name} (${t.id})`);
    } else {
      summary.created += 1;
      console.log(`[${SCRIPT}] Created: ${t.name} (${t.id})`);
    }
  }

  printSummary(SCRIPT, summary);
}

main()
  .catch((err) => {
    console.error(`[${SCRIPT}] Failed:`, err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());