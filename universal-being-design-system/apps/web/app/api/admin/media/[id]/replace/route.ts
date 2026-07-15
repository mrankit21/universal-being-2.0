/**
 * POST /api/admin/media/[id]/replace — swap the binary/URL behind an
 * existing library record while keeping its `_id`, title, category, tags,
 * and "Used In" identity intact (Step 7.6A spec §"IMAGE REPLACEMENT").
 *
 * Scope note: this updates the Media Library record itself. Propagating the
 * new URL into already-published Trip/Destination/Homepage documents (which
 * currently embed `ImageAsset` by value, not by reference) is Step 7.6B's
 * job — see the module doc-comment on `lib/db/models/media.model.ts`.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { MediaModel } from "@/lib/db/models";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { findUsageForAsset } from "@/lib/media/usage";
import { attachMediaAssetToTrip } from "@/lib/media/attach-to-trip";
import { deleteImageKitFileSafely } from "@/lib/media/imagekit";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const replaceSchema = z.object({
  provider: z.enum(["imagekit", "cloudinary", "local", "placeholder"]).default("imagekit"),
  publicId: z.string().optional(),
  url: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  width: z.number().int().min(0).default(0),
  height: z.number().int().min(0).default(0),
  bytes: z.number().optional(),
  mimeType: z.string().optional(),
  filename: z.string().min(1),
  // Optional — replacing the file doesn't have to change how it reads.
  alt: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("media:write");
    await connectToDatabase();
    const { id } = await params;
    const patch = replaceSchema.parse(await req.json());

    const existing = await MediaModel.findById(id);
    if (!existing) return fail("Media asset not found", 404);

    // Snapshot who used the OLD image before we overwrite the URL, so we can
    // tell the admin what will need re-saving until Step 7.6B wires live
    // propagation.
    const previousUsage = await findUsageForAsset(existing.url, existing.publicId);
    // Also snapshot the OLD provider/publicId so the old ImageKit file can
    // be removed after the swap succeeds (no orphan files left behind).
    const previousProvider = existing.provider;
    const previousPublicId = existing.publicId;

    existing.provider = patch.provider;
    existing.publicId = patch.publicId;
    existing.url = patch.url;
    existing.thumbnailUrl = patch.thumbnailUrl;
    existing.width = patch.width;
    existing.height = patch.height;
    existing.bytes = patch.bytes;
    existing.mimeType = patch.mimeType;
    existing.filename = patch.filename;
    if (patch.alt !== undefined) existing.alt = patch.alt;

    await existing.save();

    // Clean up the OLD file in ImageKit now that the new one is safely
    // saved (best-effort — never throws — see `deleteImageKitFileSafely`).
    // Skipped if the old asset wasn't an ImageKit file, or if the "new"
    // publicId is somehow the same as the old one.
    if (previousProvider === "imagekit" && previousPublicId && previousPublicId !== existing.publicId) {
      await deleteImageKitFileSafely(previousPublicId);
    }

    // Trip-First CMS: a replaced image that's tagged to a Trip slot should
    // propagate immediately, same as on create — no separate re-save step.
    await attachMediaAssetToTrip({
      assetType: existing.assetType,
      relatedTripSlug: existing.relatedTripSlug,
      usage: existing.usage,
      galleryPosition: existing.galleryPosition,
      url: existing.url,
      publicId: existing.publicId,
      provider: existing.provider,
      alt: existing.alt,
      width: existing.width,
      height: existing.height,
      blurHash: existing.blurHash,
    });

    const usageReferences = await findUsageForAsset(existing.url, existing.publicId);
    const isTripAsset = existing.assetType === "trip" && !!existing.relatedTripSlug && !!existing.usage;
    return ok({
      ...existing.toObject(),
      usageReferences,
      previousUsage,
      note:
        previousUsage.length > 0 && !isTripAsset
          ? `Heads up: ${previousUsage.length} page${previousUsage.length === 1 ? "" : "s"} still show the old image and will need re-saving to pick up the new one (Step 7.6B connects live propagation).`
          : undefined,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
