import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { Trip2Model, type Trip2Document } from "@/lib/db/models";

/**
 * lib/api/trip2.ts — DB-first resolver for Trip 2.0 pages, same swap
 * point pattern as `lib/api/home2.ts`. `app/trip2/[slug]/page.tsx` calls
 * this to fetch one Trip 2.0 document by slug and hand it straight to
 * `components/trip/v2/*`, whose props already match this shape closely
 * enough that little to no mapping is needed.
 *
 * Unlike Homepage 2.0 (a singleton with a static fallback), Trip 2.0 has
 * no meaningful "static fallback" per slug — there's nothing sensible to
 * show for a slug nobody created. When the DB isn't configured, or no
 * published document exists for that slug, this returns `null` and the
 * page calls `notFound()`. The static, backend-free `/new-trip` preview
 * (kept intentionally untouched) is still the place to see the Trip 2.0
 * UI with mock content when there's no database at all.
 */
export type ResolvedTrip2 = Omit<Trip2Document, keyof import("mongoose").Document> & { _id: string };

export async function getResolvedTrip2(slug: string): Promise<ResolvedTrip2 | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    await connectToDatabase();
    const doc = await Trip2Model.findOne({ slug, status: "published" }).lean();
    if (!doc) return null;
    return { ...doc, _id: String(doc._id) } as unknown as ResolvedTrip2;
  } catch (err) {
    console.error(`[getResolvedTrip2] MongoDB unreachable while resolving slug "${slug}":`, err);
    return null;
  }
}

/** All published slugs, for `generateStaticParams`. Returns an empty
 * array (rather than throwing) when the DB isn't configured, so a build
 * without `MONGODB_URI` set still succeeds with zero Trip 2.0 pages
 * pre-rendered instead of failing the whole build. */
export async function getAllPublishedTrip2Slugs(): Promise<string[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    await connectToDatabase();
    const docs = await Trip2Model.find({ status: "published" }).select("slug").lean();
    return docs.map((d) => d.slug);
  } catch (err) {
    console.error("[getAllPublishedTrip2Slugs] MongoDB unreachable:", err);
    return [];
  }
}

/** Lightweight card-shaped projection of one published Trip 2.0 document —
 * just enough to render a listing/featured card, without the full
 * `ResolvedTrip2` payload (gallery, itinerary, FAQs, etc). */
export interface Trip2CardSummary {
  slug: string;
  title: string;
  shortDescription: string;
  location: string;
  heroImage?: { url?: string; alt?: string; isPlaceholder?: boolean };
}

/** Every published Trip 2.0 document, card-shaped. Used wherever a
 * listing needs to show Trip 2.0 trips specifically (e.g. Homepage 2.0's
 * Featured Trips when Site Settings' "Trips Version" is forced to "v2") —
 * as opposed to `getResolvedTrip2`, which fetches one full trip by slug.
 * Same empty-array-on-no-DB fallback as `getAllPublishedTrip2Slugs`. */
export async function getPublishedTrip2Trips(): Promise<Trip2CardSummary[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    await connectToDatabase();
    const docs = await Trip2Model.find({ status: "published" })
      .select("slug title shortDescription location heroImage")
      .lean();
    return docs.map((d) => ({
      slug: d.slug,
      title: d.title,
      shortDescription: d.shortDescription,
      location: d.location,
      heroImage: d.heroImage as Trip2CardSummary["heroImage"],
    }));
  } catch (err) {
    console.error("[getPublishedTrip2Trips] MongoDB unreachable:", err);
    return [];
  }
}

/** One published Trip 2.0 document by slug, card-shaped — cheaper than
 * `getResolvedTrip2` when only listing-card fields are needed (used to
 * check "does a Trip 2.0 page exist for this admin-chosen slug" without
 * pulling the whole document). Returns `null` when unpublished/missing,
 * same as `getResolvedTrip2`. */
export async function getPublishedTrip2CardBySlug(slug: string): Promise<Trip2CardSummary | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    await connectToDatabase();
    const doc = await Trip2Model.findOne({ slug, status: "published" })
      .select("slug title shortDescription location heroImage")
      .lean();
    if (!doc) return null;
    return {
      slug: doc.slug,
      title: doc.title,
      shortDescription: doc.shortDescription,
      location: doc.location,
      heroImage: doc.heroImage as Trip2CardSummary["heroImage"],
    };
  } catch (err) {
    console.error(`[getPublishedTrip2CardBySlug] MongoDB unreachable while resolving slug "${slug}":`, err);
    return null;
  }
}
