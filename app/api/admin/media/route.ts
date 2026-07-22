/**
 * GET  /api/admin/media  — list media library assets (requirement #7),
 *                           filterable by category, searchable by
 *                           title/filename/alt/tags, paginated, with a live
 *                           "Used In" reference list attached to each item.
 * POST /api/admin/media  — register an asset record. The actual binary
 *                           upload happens client-side straight to ImageKit
 *                           using the signed params from
 *                           `/api/admin/media/sign` (Architecture §7:
 *                           "binary never touches the Node server"); this
 *                           endpoint just persists the resulting asset
 *                           metadata ImageKit hands back.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { MediaModel, MEDIA_CATEGORIES } from "@/lib/db/models";
import { ok, created, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { findUsageForAssets } from "@/lib/media/usage";
import { slugify, titleFromFilename } from "@/lib/media/slug";
import { attachMediaAssetToTrip } from "@/lib/media/attach-to-trip";
import { z } from "zod";

const mediaCreateSchema = z.object({
  provider: z.enum(["imagekit", "cloudinary", "local", "placeholder"]).default("imagekit"),
  publicId: z.string().optional(),
  url: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  title: z.string().optional(),
  alt: z.string().default(""),
  width: z.number().int().min(0).default(0),
  height: z.number().int().min(0).default(0),
  blurHash: z.string().optional(),
  category: z.enum(MEDIA_CATEGORIES).default("general"),
  tags: z.array(z.string()).default([]),
  filename: z.string().min(1),
  mimeType: z.string().optional(),
  bytes: z.number().optional(),
  // SmartMediaUpload wizard metadata (Trip-First CMS revision) — all
  // optional so plain/legacy uploads keep working unchanged.
  assetType: z.string().optional(),
  relatedTripSlug: z.string().optional(),
  relatedTripTitle: z.string().optional(),
  relatedDestinationSlug: z.string().optional(),
  relatedDestinationName: z.string().optional(),
  usage: z.string().optional(),
  heroSlideNumber: z.number().int().min(1).max(6).optional(),
  galleryPosition: z.number().int().min(1).max(6).optional(),
  // Trip-scoped uploads (Trip Editor's own "upload for this trip" fields
  // and Gallery multi-upload) — keeps them out of the main Media Library
  // grid entirely. Defaults to "library" so every existing caller (Media
  // Library page, SmartMediaUpload wizard) is unaffected.
  scope: z.enum(["library", "trip"]).default("library"),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission("media:read");
    await connectToDatabase();

    const params = req.nextUrl.searchParams;
    const category = params.get("category");
    const q = params.get("q")?.trim();
    const unusedOnly = params.get("unused") === "true";
    const page = Math.max(1, Number(params.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.get("limit")) || 24));
    const sort = params.get("sort") === "oldest" ? { createdAt: 1 as const } : { createdAt: -1 as const };

    // Scope: defaults to "library" so the Media Library page (which never
    // sends this param) keeps showing exactly what it always has — never
    // any image uploaded from inside a Trip's own editor. A Trip editor
    // explicitly requests `scope=trip&tripSlug=...` to see (only) its own
    // uploads. `scope=all` is available for internal/admin tooling.
    const scopeParam = params.get("scope");
    const scope = scopeParam === "trip" || scopeParam === "all" ? scopeParam : "library";
    const tripSlug = params.get("tripSlug")?.trim();

    const filter: Record<string, unknown> = {};
    if (scope === "library") {
      // Pre-existing documents have no `scope` at all (created before this
      // field existed) — treat those as "library" too, same as the schema
      // default, so nothing that used to show up disappears.
      filter.scope = { $in: ["library", null] };
    } else if (scope === "trip") {
      filter.scope = "trip";
      if (tripSlug) filter.relatedTripSlug = tripSlug;
    }
    if (category && category !== "all") filter.category = category;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { filename: { $regex: q, $options: "i" } },
        { alt: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
    }

    // Category badge counts should reflect the same scope as the list
    // itself (so, e.g., the Media Library page's per-category counts never
    // include images uploaded from inside a Trip editor) — but not the
    // text search, so switching categories from a search still shows every
    // category's total rather than only ones matching the current query.
    const scopeOnlyFilter: Record<string, unknown> = {};
    if (filter.scope) scopeOnlyFilter.scope = filter.scope;
    if (filter.relatedTripSlug) scopeOnlyFilter.relatedTripSlug = filter.relatedTripSlug;

    const [items, total, categoryCounts] = await Promise.all([
      MediaModel.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MediaModel.countDocuments(filter),
      MediaModel.aggregate([
        { $match: scopeOnlyFilter },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const usageMap = await findUsageForAssets(items.map((i) => ({ url: i.url, publicId: i.publicId })));
    let itemsWithUsage = items.map((item) => ({
      ...item,
      usageReferences: usageMap.get(item.url) ?? [],
    }));

    if (unusedOnly) {
      itemsWithUsage = itemsWithUsage.filter((i) => i.usageReferences.length === 0);
    }

    return ok({
      items: itemsWithUsage,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      categories: Object.fromEntries(categoryCounts.map((c: { _id: string; count: number }) => [c._id, c.count])),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("media:write");
    await connectToDatabase();
    const parsed = mediaCreateSchema.parse(await req.json());
    const title = parsed.title?.trim() || titleFromFilename(parsed.filename);
    const baseSlug = slugify(title);
    // Keep slugs unique without a DB-level unique index (which would break
    // legitimate same-name re-uploads) — append a short suffix on collision.
    let slug = baseSlug;
    let attempt = 0;
    while (await MediaModel.exists({ slug })) {
      attempt += 1;
      slug = `${baseSlug}-${attempt + 1}`;
    }
    const asset = await MediaModel.create({ ...parsed, title, slug, uploadedBy: session.email });

    // Trip-First CMS: if this upload came through the wizard tagged as a
    // Trip image (Homepage Hero / Trip Hero / Cover / Thumbnail / Gallery),
    // write it straight onto the selected Trip document too, so the public
    // site and Homepage pick it up without a separate "paste the URL into
    // the Trip Editor" step.
    //
    // This is deliberately isolated in its own try/catch: the Media record
    // above has already been created and committed by this point, so if
    // attaching it to the Trip fails (bad slug, a Trip validation error,
    // etc.) that should NOT make the whole upload look like it failed —
    // that was the previous behavior (an uncaught throw here fell through
    // to handleApiError and returned success:false even though the asset
    // was already sitting in the Media Library). Now the asset registration
    // always succeeds if it got this far, and a Trip-attach problem is
    // reported back as a non-fatal `note` instead of eating the upload.
    let attachNote: string | undefined;
    try {
      await attachMediaAssetToTrip({
        assetType: parsed.assetType,
        relatedTripSlug: parsed.relatedTripSlug,
        usage: parsed.usage,
        galleryPosition: parsed.galleryPosition,
        heroSlideNumber: parsed.heroSlideNumber,
        url: asset.url,
        publicId: asset.publicId,
        provider: asset.provider,
        alt: asset.alt,
        width: asset.width,
        height: asset.height,
        blurHash: asset.blurHash,
      });
    } catch (attachErr) {
      console.error("[media] uploaded but failed to attach to trip:", attachErr);
      attachNote =
        "Saved to the Media Library, but attaching it to the selected Trip failed. " +
        "You can attach it manually from the Trip Editor.";
    }

    return created({ ...asset.toObject(), usageReferences: [], ...(attachNote ? { note: attachNote } : {}) });
  } catch (err) {
    return handleApiError(err);
  }
}
