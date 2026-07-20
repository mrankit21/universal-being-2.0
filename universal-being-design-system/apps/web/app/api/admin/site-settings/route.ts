/** GET/PATCH /api/admin/site-settings — Site Settings singleton (requirement #8). */
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SiteSettingsModel } from "@/lib/db/models";
import { siteSettingsUpdateSchema } from "@/lib/validators/site-settings.schema";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { siteConfig as seedSiteConfig } from "@/data/layout/site-config";

async function getOrCreateSingleton() {
  let doc = await SiteSettingsModel.findOne();
  if (!doc) {
    doc = await SiteSettingsModel.create({
      brandName: seedSiteConfig.brandName,
      tagline: seedSiteConfig.tagline,
      brandStory: seedSiteConfig.brandStory,
      contact: {
        phone: seedSiteConfig.contact.phoneHref.replace("tel:", ""),
        whatsapp: seedSiteConfig.contact.whatsappHref,
        email: seedSiteConfig.contact.email,
        address: "",
      },
      socialLinks: seedSiteConfig.socialLinks,
      seoDefaults: { title: seedSiteConfig.brandName, description: seedSiteConfig.tagline },
      footer: {
        columns: seedSiteConfig.footerColumns,
        copyrightHolder: seedSiteConfig.copyrightHolder,
      },
    });
  }
  return doc;
}

export async function GET() {
  try {
    await requirePermission("settings:read");
    await connectToDatabase();
    const settings = await getOrCreateSingleton();
    return ok(settings);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requirePermission("settings:write");
    await connectToDatabase();
    const parsed = siteSettingsUpdateSchema.parse(await req.json());
    // See destinations/[id]/route.ts — `.partial()` leaves untouched fields
    // as explicit `undefined` rather than omitting them. Object.assign
    // copies those `undefined`s onto `doc` too, so a save() here could wipe
    // required fields the client never sent.
    const update = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined));

    const doc = await getOrCreateSingleton();
    Object.assign(doc, update, { updatedBy: session.email });
    await doc.save();

    revalidatePath("/", "layout");
    return ok(doc);
  } catch (err) {
    return handleApiError(err);
  }
}
