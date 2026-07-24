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
    const body = await req.json();
    const parsed = siteSettingsUpdateSchema.parse(body);
    // Only forward keys the client actually sent in the RAW body. Filtering
    // on `v !== undefined` is not enough: fields with a `.default()` get
    // that default silently applied by zod even when the client never sent
    // the key, so they come back *defined* and slip through a definedness
    // filter — Object.assign would then overwrite the real value on `doc`.
    // Checking the pre-zod `body` for the key is the only reliable way to
    // tell "client sent this" from "zod defaulted this".
    const update = Object.fromEntries(
      Object.entries(parsed).filter(([k]) => Object.prototype.hasOwnProperty.call(body, k))
    );

    const doc = await getOrCreateSingleton();
    Object.assign(doc, update, { updatedBy: session.email });
    await doc.save();

    revalidatePath("/", "layout");
    return ok(doc);
  } catch (err) {
    return handleApiError(err);
  }
}
