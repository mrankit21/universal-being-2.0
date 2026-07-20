import type { ThemeKey } from "@/types/theme";
import type { ImageAsset } from "@/types/trip";

/**
 * HomeTripSummary — a deliberately small, homepage-only shape. This is NOT
 * the future Phase-3 `Trip` domain model (which will carry itinerary,
 * departures, booking data, etc.) — it exists so the homepage has something
 * real to render today. When the real Trip data layer lands, this file goes
 * away and `FeaturedTripsSection` swaps its data source only; the card UI
 * underneath does not need to change shape-for-shape since both expose the
 * same handful of display fields.
 */
export interface HomeTripSummary {
  slug: string;
  title: string;
  location: string;
  themeKey: ThemeKey;
  durationLabel: string;
  groupSizeLabel: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  /** Seats left on the next departure — homepage urgency badge only, not a
   * booking-system value. Omit to hide the badge (e.g. plenty of availability). */
  seatsLeft?: number;
  /** The Trip's `coverImage`, once real photography exists (Admin Panel →
   * Media Library → attach to a Trip's Cover Image). `HomeTripCard` renders
   * this through `TripImage`, which already falls back to the themed
   * placeholder panel when `isPlaceholder` is true — so this is safe to omit
   * for the static seed data below, which has no real photos. */
  image?: ImageAsset;
}

/**
 * No real trip photography exists yet (Content/Image data layer is a later
 * phase — see DESIGN_SYSTEM.md's note on `lib/image/resolve-image.ts` not
 * yet building real ImageKit transform URLs). Rather than stretch a
 * decorative pattern SVG into `UbImage` as a fake photo — which would
 * misuse a component whose documented
 * contract is real photography — each card's visual header renders through
 * `ThemeBackground` instead, themed per trip. When real photos land, swap
 * that header for `UbImage` and this type gains an `image` field; nothing
 * else about the card changes.
 */
export const featuredTrips: HomeTripSummary[] = [
  {
    slug: "rajasthan-royals",
    title: "Rajasthan Royals",
    location: "Jaipur → Jodhpur → Udaipur",
    themeKey: "rajasthan",
    durationLabel: "7 days",
    groupSizeLabel: "12–16 people",
    rating: 4.8,
    reviewCount: 214,
    price: 24999,
    originalPrice: 28999,
    seatsLeft: 4,
  },
  {
    slug: "himalayan-winter-trail",
    title: "Himalayan Winter Trail",
    location: "Manali → Sissu → Kasol",
    themeKey: "winter",
    durationLabel: "6 days",
    groupSizeLabel: "10–14 people",
    rating: 4.9,
    reviewCount: 168,
    price: 21999,
    seatsLeft: 3,
  },
  {
    slug: "monsoon-in-the-ghats",
    title: "Monsoon in the Ghats",
    location: "Lonavala → Mahabaleshwar",
    themeKey: "monsoon",
    durationLabel: "4 days",
    groupSizeLabel: "14–18 people",
    rating: 4.6,
    reviewCount: 132,
    price: 12999,
  },
  {
    slug: "goa-beach-reset",
    title: "Goa Beach Reset",
    location: "North Goa → South Goa",
    themeKey: "beach",
    durationLabel: "5 days",
    groupSizeLabel: "12–16 people",
    rating: 4.7,
    reviewCount: 289,
    price: 17999,
    originalPrice: 20999,
    seatsLeft: 6,
  },
  {
    slug: "western-ghats-forest-trail",
    title: "Western Ghats Forest Trail",
    location: "Coorg → Chikmagalur",
    themeKey: "forest",
    durationLabel: "5 days",
    groupSizeLabel: "10–14 people",
    rating: 4.8,
    reviewCount: 97,
    price: 16999,
  },
];