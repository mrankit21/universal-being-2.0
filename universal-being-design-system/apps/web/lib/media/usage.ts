/**
 * "Used In" resolver (Step 7.6A spec §"USED IN"). Read-only scan across the
 * content collections that embed an `ImageAsset` by value (Trip,
 * Destination, Homepage, Testimonial) matching on `url`/`publicId`, so the
 * Media Library can show where each asset is used without those
 * collections needing a `mediaId` back-reference — that wiring is Step
 * 7.6B's job. This module never writes to Trip/Destination/Homepage/
 * Testimonial; it only reads them.
 */
import { TripModel, DestinationModel, HomepageModel, TestimonialModel, AnnouncementModel, SiteSettingsModel } from "@/lib/db/models";
import type { MediaUsageReference } from "@/lib/db/models/media.model";

/** Shape of the `.select(...).lean()` projections read in this file. Only
 * the fields actually accessed below are declared — this mirrors the
 * Mongoose `.select()` calls, not the full model schemas. */
interface UsageImageRef {
  url?: string;
}

interface TripUsageProjection {
  slug: string;
  title?: string;
  heroImage?: UsageImageRef;
  coverImage?: UsageImageRef;
  thumbnail?: UsageImageRef;
  homepageHeroImage?: UsageImageRef;
  gallery?: UsageImageRef[];
  reviews?: Array<{ customerName?: string; customerPhoto?: UsageImageRef }>;
  itinerary?: Array<{ day?: number; images?: UsageImageRef[] }>;
  accommodation?: Array<{ hotelName?: string; images?: UsageImageRef[] }>;
}

interface DestinationUsageProjection {
  slug: string;
  name?: string;
  heroImage?: UsageImageRef;
  coverImage?: UsageImageRef;
  gallery?: UsageImageRef[];
}

interface HomepageUsageProjection {
  heroSlides?: Array<{ image?: UsageImageRef; destinationLabel?: string }>;
  promoBanner?: { image?: UsageImageRef };
  ctaSection?: { backgroundImage?: UsageImageRef };
}

interface TestimonialUsageProjection {
  _id: unknown;
  authorName?: string;
  avatar?: UsageImageRef;
}

interface AnnouncementUsageProjection {
  _id: unknown;
  message?: string;
  image?: UsageImageRef;
}

interface SiteSettingsUsageProjection {
  logo?: UsageImageRef;
  logoDark?: UsageImageRef;
  favicon?: UsageImageRef;
  ogImage?: UsageImageRef;
  appleTouchIcon?: UsageImageRef;
  [field: string]: UsageImageRef | undefined;
}

/**
 * Given a batch of {url, publicId} pairs, returns a Map keyed by url with
 * every place that image is currently embedded. Runs a handful of lean
 * queries total (not one per asset) so it stays cheap on a media grid page.
 */
export async function findUsageForAssets(
  assets: Array<{ url: string; publicId?: string }>
): Promise<Map<string, MediaUsageReference[]>> {
  const result = new Map<string, MediaUsageReference[]>();
  for (const a of assets) result.set(a.url, []);
  if (assets.length === 0) return result;

  const urls = assets.map((a) => a.url).filter(Boolean);
  const publicIds = assets.map((a) => a.publicId).filter(Boolean) as string[];
  if (urls.length === 0 && publicIds.length === 0) return result;

  const urlMatch = (field: string) => ({ [`${field}.url`]: { $in: urls } });

  const [trips, destinations, homepage, testimonials, announcements, siteSettings] = await Promise.all([
    TripModel.find({
      $or: [
        urlMatch("heroImage"),
        urlMatch("coverImage"),
        urlMatch("thumbnail"),
        urlMatch("homepageHeroImage"),
        { "gallery.url": { $in: urls } },
        { "reviews.customerPhoto.url": { $in: urls } },
        { "itinerary.images.url": { $in: urls } },
        { "accommodation.images.url": { $in: urls } },
      ],
    })
      .select("slug title heroImage coverImage thumbnail homepageHeroImage gallery reviews itinerary accommodation")
      .lean(),
    DestinationModel.find({
      $or: [urlMatch("heroImage"), urlMatch("coverImage"), { "gallery.url": { $in: urls } }],
    })
      .select("slug name heroImage coverImage gallery")
      .lean(),
    HomepageModel.findOne({
      $or: [urlMatch("hero.backgroundImage"), urlMatch("promoBanner.image"), urlMatch("ctaSection.backgroundImage")],
    })
      .select("hero promoBanner ctaSection")
      .lean(),
    TestimonialModel.find({ "avatar.url": { $in: urls } }).select("authorName avatar").lean(),
    AnnouncementModel.find({ "image.url": { $in: urls } }).select("message image").lean(),
    SiteSettingsModel.findOne({
      $or: [urlMatch("logo"), urlMatch("logoDark"), urlMatch("favicon"), urlMatch("ogImage"), urlMatch("appleTouchIcon")],
    })
      .select("logo logoDark favicon ogImage appleTouchIcon")
      .lean(),
  ]);

  function push(url: string | undefined, ref: MediaUsageReference) {
    if (!url) return;
    const list = result.get(url);
    if (list) list.push(ref);
  }

  for (const trip of trips as TripUsageProjection[]) {
    const label = trip.title || trip.slug;
    const href = `/admin/trips/${trip.slug}`;
    if (trip.heroImage?.url && urls.includes(trip.heroImage.url)) {
      push(trip.heroImage.url, { model: "Trip", id: trip.slug, label, field: "heroImage", href });
    }
    if (trip.coverImage?.url && urls.includes(trip.coverImage.url)) {
      push(trip.coverImage.url, { model: "Trip", id: trip.slug, label, field: "coverImage", href });
    }
    if (trip.thumbnail?.url && urls.includes(trip.thumbnail.url)) {
      push(trip.thumbnail.url, { model: "Trip", id: trip.slug, label, field: "thumbnail", href });
    }
    if (trip.homepageHeroImage?.url && urls.includes(trip.homepageHeroImage.url)) {
      push(trip.homepageHeroImage.url, { model: "Trip", id: trip.slug, label, field: "homepageHeroImage", href });
    }
    for (const img of trip.gallery ?? []) {
      if (img?.url && urls.includes(img.url)) {
        push(img.url, { model: "Trip", id: trip.slug, label, field: "gallery", href });
      }
    }
    for (const review of trip.reviews ?? []) {
      if (review?.customerPhoto?.url && urls.includes(review.customerPhoto.url)) {
        push(review.customerPhoto.url, {
          model: "Trip",
          id: trip.slug,
          label,
          field: `reviews (${review.customerName || "customer"})`,
          href,
        });
      }
    }
    for (const day of trip.itinerary ?? []) {
      for (const img of day?.images ?? []) {
        if (img?.url && urls.includes(img.url)) {
          push(img.url, { model: "Trip", id: trip.slug, label, field: `itinerary (Day ${day.day})`, href });
        }
      }
    }
    for (const hotel of trip.accommodation ?? []) {
      for (const img of hotel?.images ?? []) {
        if (img?.url && urls.includes(img.url)) {
          push(img.url, { model: "Trip", id: trip.slug, label, field: `accommodation (${hotel.hotelName || "hotel"})`, href });
        }
      }
    }
  }

  for (const dest of destinations as DestinationUsageProjection[]) {
    const label = dest.name || dest.slug;
    const href = `/admin/destinations/${dest.slug}`;
    if (dest.heroImage?.url && urls.includes(dest.heroImage.url)) {
      push(dest.heroImage.url, { model: "Destination", id: dest.slug, label, field: "heroImage", href });
    }
    if (dest.coverImage?.url && urls.includes(dest.coverImage.url)) {
      push(dest.coverImage.url, { model: "Destination", id: dest.slug, label, field: "coverImage", href });
    }
    for (const img of dest.gallery ?? []) {
      if (img?.url && urls.includes(img.url)) {
        push(img.url, { model: "Destination", id: dest.slug, label, field: "gallery", href });
      }
    }
  }

  if (homepage) {
    const hp = homepage as HomepageUsageProjection;
    for (const [i, slide] of (hp.heroSlides ?? []).entries()) {
      if (slide?.image?.url && urls.includes(slide.image.url)) {
        push(slide.image.url, {
          model: "Homepage",
          id: "homepage",
          label: `Homepage Hero Slide ${i + 1}${slide.destinationLabel ? ` (${slide.destinationLabel})` : ""}`,
          field: `heroSlides[${i}].image`,
          href: "/admin/homepage",
        });
      }
    }
    if (hp.promoBanner?.image?.url && urls.includes(hp.promoBanner.image.url)) {
      push(hp.promoBanner.image.url, {
        model: "Homepage",
        id: "homepage",
        label: "Homepage Promo Banner",
        field: "promoBanner.image",
        href: "/admin/homepage",
      });
    }
    if (hp.ctaSection?.backgroundImage?.url && urls.includes(hp.ctaSection.backgroundImage.url)) {
      push(hp.ctaSection.backgroundImage.url, {
        model: "Homepage",
        id: "homepage",
        label: "Homepage CTA Section",
        field: "ctaSection.backgroundImage",
        href: "/admin/homepage",
      });
    }
  }

  for (const t of testimonials as TestimonialUsageProjection[]) {
    if (t.avatar?.url && urls.includes(t.avatar.url)) {
      push(t.avatar.url, {
        model: "Testimonial",
        id: String(t._id),
        label: t.authorName ?? "Testimonial",
        field: "avatar",
        href: "/admin/testimonials",
      });
    }
  }

  for (const a of announcements as AnnouncementUsageProjection[]) {
    if (a.image?.url && urls.includes(a.image.url)) {
      push(a.image.url, {
        model: "Announcement",
        id: String(a._id),
        label: a.message ?? "Announcement",
        field: "image",
        href: "/admin/announcements",
      });
    }
  }

  if (siteSettings) {
    const ss = siteSettings as unknown as SiteSettingsUsageProjection;
    const settingsFields: Array<[string, string]> = [
      ["logo", "Logo"],
      ["logoDark", "Dark Logo"],
      ["favicon", "Favicon"],
      ["ogImage", "Open Graph Image"],
      ["appleTouchIcon", "Apple Touch Icon"],
    ];
    for (const [field, label] of settingsFields) {
      const asset = ss[field];
      if (asset?.url && urls.includes(asset.url)) {
        push(asset.url, {
          model: "SiteSettings",
          id: "site-settings",
          label,
          field,
          href: "/admin/settings",
        });
      }
    }
  }

  return result;
}

export async function findUsageForAsset(url: string, publicId?: string): Promise<MediaUsageReference[]> {
  const map = await findUsageForAssets([{ url, publicId }]);
  return map.get(url) ?? [];
}
