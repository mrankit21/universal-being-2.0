/**
 * REVISION 2 — Trip-First CMS Architecture, Part 1 ("Image should
 * automatically attach to the selected Trip").
 *
 * Before this, a Media Library upload tagged `assetType: "trip"` only
 * recorded *intent* (`relatedTripSlug`, `usage`, `galleryPosition` …) on the
 * Media document — it never touched the Trip's own `heroImage` /
 * `coverImage` / `thumbnail` / `homepageHeroImage` / `gallery` fields, which
 * is what the public site and Homepage actually render. That meant an admin
 * had to upload the image here *and* separately paste the URL into the Trip
 * Editor — exactly the duplicated-management problem this revision is
 * about removing.
 *
 * This module closes that loop: whenever a Trip-asset upload is created or
 * edited with a Trip + Image Type selected, it writes an `ImageAsset`
 * (Architecture §13 shape) straight onto the matching Trip field, so the
 * attach happens automatically and the Trip page / Homepage cards update on
 * next read — no separate "paste the URL again" step, no code changes.
 *
 * It also revalidates the affected Trip's public surfaces itself (rather
 * than leaving that to each caller), since `/trips/[slug]` is statically
 * generated and won't otherwise pick up the new image until something
 * explicitly invalidates its cached HTML (see `lib/api-helpers/revalidate`).
 *
 * Deliberately narrow: it only ever writes when `assetType === "trip"` and
 * both a Trip and a Usage are present. Every other asset type (Logo,
 * Announcement, Review, General, and any legacy Homepage Hero/Destination/
 * Gallery/CTA records) is left exactly as before.
 */
import { TripModel } from "@/lib/db/models/trip.model";
import { revalidateTripSurfaces } from "@/lib/api-helpers/revalidate";

export interface AttachableMediaAsset {
  assetType?: string;
  relatedTripSlug?: string;
  usage?: string;
  galleryPosition?: number;
  /**
   * NOTE — schema mismatch, not yet resolved: the Media Library wizard
   * (SmartMediaUpload) lets an admin pick "Hero Slide" 1–6 for a
   * `homepage-hero-image` upload, implying a Trip can have multiple
   * homepage hero slides. But `TripDocument.homepageHeroImage` (see
   * trip.model.ts) is a single required `ImageAsset`, not an array. So
   * today, picking Slide 1 vs Slide 4 for the same Trip has *no*
   * observable difference — both just overwrite the one field, and
   * whichever upload happens last wins. This field is accepted and
   * stored on the Media record for now, but intentionally NOT used to
   * pick a write target below. Fixing this for real needs a product
   * decision (turn `homepageHeroImage` into an array of slides — a
   * schema change touching every already-seeded Trip document — or
   * drop the "Hero Slide" step from the wizard since only one image is
   * ever actually used). Don't silently pick one without confirming.
   */
  heroSlideNumber?: number;
  url: string;
  publicId?: string;
  provider: string;
  alt?: string;
  width?: number;
  height?: number;
  blurHash?: string;
}

function toImageAsset(asset: AttachableMediaAsset) {
  return {
    provider: asset.provider ?? "imagekit",
    publicId: asset.publicId,
    url: asset.url,
    alt: asset.alt ?? "",
    width: asset.width ?? 1600,
    height: asset.height ?? 900,
    blurHash: asset.blurHash,
    isPlaceholder: false,
  };
}

/** Maps a Trip asset's "Image Type" (Usage) to the Trip document field it
 * should be written onto. `gallery-image` is handled separately since it's
 * an array slot, not a single field. */
const USAGE_TO_TRIP_FIELD: Record<string, string> = {
  "homepage-hero-image": "homepageHeroImage",
  "trip-hero-image": "heroImage",
  "cover-image": "coverImage",
  thumbnail: "thumbnail",
};

/**
 * Attaches a Media Library asset to its selected Trip, if applicable, and
 * revalidates that Trip's public pages so the change is visible immediately.
 * Safe to call for every asset — it's a no-op unless `assetType === "trip"`
 * with both a Trip and an Image Type chosen. Never throws for a missing
 * Trip (the wizard already validated it existed at selection time; if it
 * was deleted meanwhile, this silently skips rather than failing the
 * Media Library save).
 *
 * Returns the trip's `{ slug, destinationSlug }` when a write happened, or
 * `null` when this asset wasn't a Trip attachment (or the trip was gone).
 */
export async function attachMediaAssetToTrip(
  asset: AttachableMediaAsset
): Promise<{ slug: string; destinationSlug?: string } | null> {
  if (asset.assetType !== "trip" || !asset.relatedTripSlug || !asset.usage) return null;

  const imageAsset = toImageAsset(asset);

  if (asset.usage === "gallery-image") {
    const position = Math.min(6, Math.max(1, asset.galleryPosition ?? 1));
    const trip = await TripModel.findOne({ slug: asset.relatedTripSlug });
    if (!trip) return null;
    const gallery = Array.isArray(trip.gallery) ? [...trip.gallery] : [];
    while (gallery.length < position) gallery.push(undefined as unknown as typeof imageAsset);
    gallery[position - 1] = imageAsset;
    trip.gallery = gallery.filter(Boolean) as unknown as typeof trip.gallery;
    await trip.save();
    revalidateTripSurfaces(trip);
    return { slug: trip.slug, destinationSlug: trip.destinationSlug };
  }

  const field = USAGE_TO_TRIP_FIELD[asset.usage];
  if (!field) return null;
  const trip = await TripModel.findOneAndUpdate(
    { slug: asset.relatedTripSlug },
    { $set: { [field]: imageAsset } },
    { new: true }
  );
  if (!trip) return null;
  revalidateTripSurfaces(trip);
  return { slug: trip.slug, destinationSlug: trip.destinationSlug };
}
