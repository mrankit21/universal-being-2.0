/**
 * Seeds MongoDB's singleton `site-settings` document from
 * `data/layout/site-config.ts` + `data/shared/real-content.ts` (contact
 * details, footer, social links, brand story) — the same real content the
 * static site has been running on, now in MongoDB so it's Admin-editable
 * per requirement #14 ("nothing should remain hardcoded").
 *
 * NOTE: `primaryNav` (header/bottom-nav links) has no field on
 * `SiteSettingsModel` — it stays static/code-level for now, same as before.
 * Only what the schema actually supports gets seeded: brandName, tagline,
 * brandStory, contact, socialLinks, footer, seoDefaults.
 *
 * Idempotent: upserts the single SiteSettings document (there's only ever one).
 *
 * Usage: npm run seed:site-settings
 */
import mongoose from "mongoose";
import { connectForSeed, printSummary, type SeedSummary } from "./seed-utils";
import { SiteSettingsModel } from "../lib/db/models";
import { siteConfig } from "../data/layout/site-config";
import { contactContent } from "../data/shared/real-content";

const SCRIPT = "seed-site-settings";

async function main() {
  await connectForSeed(SCRIPT);

  const existing = await SiteSettingsModel.findOne().select("_id").lean();

  await SiteSettingsModel.findOneAndUpdate(
    {},
    {
      $set: {
        brandName: siteConfig.brandName,
        tagline: siteConfig.tagline,
        brandStory: siteConfig.brandStory,
        contact: {
          phone: contactContent.phone,
          whatsapp: contactContent.whatsapp,
          email: siteConfig.contact.email,
          address: contactContent.officeAddress,
        },
        socialLinks: siteConfig.socialLinks,
        seoDefaults: {
          title: siteConfig.brandName,
          description: siteConfig.tagline,
        },
        footer: {
          columns: siteConfig.footerColumns,
          copyrightHolder: siteConfig.copyrightHolder,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const summary: SeedSummary = existing
    ? { created: 0, updated: 1, total: 1 }
    : { created: 1, updated: 0, total: 1 };
  printSummary(SCRIPT, summary);
}

main()
  .catch((err) => {
    console.error(`[${SCRIPT}] Failed:`, err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());