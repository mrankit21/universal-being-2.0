/**
 * GET    /api/admin/media/[id] — single asset detail, with a live "Used In"
 *                                 list, for the Media Library's side panel.
 * PATCH  /api/admin/media/[id] — edit metadata: rename (title), alt text,
 *                                 category, tags. Does not touch the binary
 *                                 — use POST .../replace for that.
 * DELETE /api/admin/media/[id] — remove the library record.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { MediaModel, MEDIA_CATEGORIES } from "@/lib/db/models";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { findUsageForAsset } from "@/lib/media/usage";
import { slugify } from "@/lib/media/slug";
import { deleteImageKitFileSafely } from "@/lib/media/imagekit";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const mediaUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  alt: z.string().optional(),
  category: z.enum(MEDIA_CATEGORIES).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("media:read");
    await connectToDatabase();
    const { id } = await params;
    const asset = await MediaModel.findById(id).lean();
    if (!asset) return fail("Media asset not found", 404);
    const usageReferences = await findUsageForAsset(asset.url, asset.publicId);
    return ok({ ...asset, usageReferences });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("media:write");
    await connectToDatabase();
    const { id } = await params;
    const patch = mediaUpdateSchema.parse(await req.json());

    const existing = await MediaModel.findById(id);
    if (!existing) return fail("Media asset not found", 404);

    if (patch.title !== undefined && patch.title !== existing.title) {
      const baseSlug = slugify(patch.title);
      let slug = baseSlug;
      let attempt = 0;
      while (await MediaModel.exists({ slug, _id: { $ne: id } })) {
        attempt += 1;
        slug = `${baseSlug}-${attempt + 1}`;
      }
      existing.slug = slug;
      existing.title = patch.title;
    }
    if (patch.alt !== undefined) existing.alt = patch.alt;
    if (patch.category !== undefined) existing.category = patch.category;
    if (patch.tags !== undefined) existing.tags = patch.tags;

    await existing.save();
    const usageReferences = await findUsageForAsset(existing.url, existing.publicId);
    return ok({ ...existing.toObject(), usageReferences });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("media:write");
    await connectToDatabase();
    const { id } = await params;
    const force = req.nextUrl.searchParams.get("force") === "true";
    const asset = await MediaModel.findById(id);
    if (!asset) return fail("Media asset not found", 404);

    const usageReferences = force ? [] : await findUsageForAsset(asset.url, asset.publicId);
    if (usageReferences.length > 0) {
      return fail(
        `This image is used in ${usageReferences.length} place${usageReferences.length === 1 ? "" : "s"}. Remove it from those first, or replace it instead of deleting.`,
        409,
        { usageReferences }
      );
    }

    // Remove the underlying file from ImageKit first (best-effort — never
    // throws, see `deleteImageKitFileSafely`) so deleting a Media record
    // never leaves an orphaned file behind. Only applies to assets actually
    // stored in ImageKit; legacy/local/placeholder records are untouched.
    if (asset.provider === "imagekit") {
      await deleteImageKitFileSafely(asset.publicId);
    }

    await asset.deleteOne();
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
