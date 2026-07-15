/**
 * Destination Domain Model — Step 6 (Trip Management System).
 *
 * A Destination is the grouping concept above Trip ("Manali" the place, vs.
 * "Manali Snow Trail" the bookable trip). One destination can have many
 * published trips. Kept as its own document (not embedded in Trip) so the
 * Admin Panel can manage destination copy/imagery once and have every trip
 * under it inherit context, per the same "shared reference, not duplicated
 * content" rule the architecture doc applies to Hotels (§14).
 */

import type { ThemeKey } from "@/types/theme";
import type { ImageAsset } from "@/types/trip";

export type DestinationStatus = "draft" | "published";

export interface DestinationSeo {
  title: string;
  description: string;
}

/**
 * DestinationTripAssignment — Step 7.6C-B Part 2's Destination ↔ Trip
 * relationship. Membership itself is still driven by `Trip.destinationSlug`
 * (the one existing, required FK — untouched so the existing Trips CMS
 * keeps working exactly as-is); this record only holds the *extra*,
 * destination-scoped metadata about that membership that doesn't belong on
 * Trip: what order it shows in on this destination's page, and whether it's
 * "featured" within this destination specifically (independent of a trip's
 * own global `featured` flag used elsewhere on the site).
 */
export interface DestinationTripAssignment {
  tripSlug: string;
  order: number;
  featured: boolean;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  region: string;
  state: string;

  /** FK into theme config — same resolver every Trip under this destination
   * defaults to unless a trip overrides its own `themeKey`. */
  themeKey: ThemeKey;

  tagline: string;
  shortDescription: string;
  longDescription: string;

  heroImage: ImageAsset;
  coverImage: ImageAsset;
  /** Card/listing thumbnail — distinct from `coverImage` so admins can crop
   * a tighter image for grid cards without touching the wider cover shot
   * used on the detail page context. Falls back to `coverImage` wherever a
   * destination hasn't set one yet (older seed/DB records). */
  thumbnail?: ImageAsset;
  /** Gallery Images (Step 7.6B §3) — sourced entirely from the Media Library. */
  gallery: ImageAsset[];

  bestSeason: string[];
  altitude?: string;
  highlights: string[];

  /** Editorial "Featured Destination" flag — independent of `status`, lets
   * admins spotlight a destination (e.g. in listings) without it being tied
   * to homepage placement. */
  featured: boolean;
  /** Whether this destination is eligible to appear in homepage-facing
   * destination widgets (e.g. the Theme Explorer section). A destination
   * can be `published` (live, bookable) but temporarily hidden from the
   * homepage by setting this to false — same "hide without deleting"
   * pattern Homepage CMS uses for its own sections. */
  homepageVisible: boolean;

  /** Destination-scoped metadata for trips assigned here — see
   * `DestinationTripAssignment`. Entries are only meaningful for trips whose
   * own `destinationSlug` currently matches this destination's `slug`. */
  tripAssignments: DestinationTripAssignment[];

  status: DestinationStatus;
  seo: DestinationSeo;

  /** See `Trip.isPlaceholderContent` — same editorial signal, destination level. */
  isPlaceholderContent: boolean;

  createdAt: string;
  updatedAt: string;
}
