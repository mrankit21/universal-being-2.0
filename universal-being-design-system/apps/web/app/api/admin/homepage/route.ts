/** GET/PATCH /api/admin/homepage — single-document Homepage Management
 * (requirement #5). Upserts a singleton doc so there's always exactly one
 * homepage config, never a "which one is live" ambiguity. */
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { HomepageModel } from "@/lib/db/models";
import { homepageUpdateSchema } from "@/lib/validators/homepage.schema";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

async function getOrCreateSingleton() {
  let doc = await HomepageModel.findOne();
  if (!doc) doc = await HomepageModel.create({});

  // Step 7.6C-B Part 1 migration: docs written before the Hero Slider
  // upgrade only have the legacy single `hero` object. Fold it into
  // `heroSlides` once, in place, so existing hero content isn't lost.
  if (doc.heroSlides.length === 0 && doc.hero && (doc.hero.heading || doc.hero.subheading)) {
    doc.heroSlides = [
      {
        destinationLabel: "",
        image: doc.hero.backgroundImage,
        heading: doc.hero.heading,
        subtitle: doc.hero.subheading,
        ctaLabel: doc.hero.ctaLabel || "Explore Trips",
        ctaHref: doc.hero.ctaHref || "/trips",
        overlayOpacity: 0.45,
        order: 0,
        enabled: true,
        themeKey: doc.hero.themeKey || "brand",
      },
    ];
    await doc.save();
  }

  return doc;
}

export async function GET() {
  try {
    await requirePermission("homepage:read");
    await connectToDatabase();
    const homepage = await getOrCreateSingleton();
    return ok(homepage);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requirePermission("homepage:write");
    await connectToDatabase();
    const parsed = homepageUpdateSchema.parse(await req.json());

    const doc = await getOrCreateSingleton();
    Object.assign(doc, parsed, { updatedBy: session.email });
    await doc.save();

    revalidatePath("/");
    return ok(doc);
  } catch (err) {
    return handleApiError(err);
  }
}
