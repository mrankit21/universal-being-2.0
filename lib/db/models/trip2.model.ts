/**
 * Trip2 Mongoose model — one document per Trip 2.0 page (unlike
 * `HomepageV2Model`, this is NOT a singleton: there are many Trip 2.0
 * pages, same as the original `TripModel`). Kept as its own collection,
 * separate from `TripModel`, exactly like `HomepageV2Model` is kept
 * separate from `HomepageModel` — the old Trip Editor and its live
 * `/trips/[slug]` pages are completely untouched by this; Trip 2.0 pages
 * live at `/trip2/[slug]` and are managed from their own "Trip 2.0"
 * section in the Admin Panel.
 *
 * Field groups map 1:1 to the serial-order sections agreed with Ankit
 * (2026-07) and the `components/trip/v2/*` components that render them:
 * hero image, title block, quick links, gallery, hotel tiers, itinerary +
 * inclusions/exclusions, price, pickup variants, batch dates, things to
 * experience, did you know, and FAQ.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;
import { ImageAssetSchema } from "./shared.schemas";

export interface Trip2QuickLinkDoc {
  icon: string;
  label: string;
  href: string;
  order: number;
}

export interface Trip2GalleryImageDoc {
  image?: unknown;
  caption: string;
  order: number;
}

export interface Trip2HotelTierDoc {
  stars: number;
  label: string;
  description: string;
}

export interface Trip2ItineraryDayDoc {
  day: number;
  title: string;
  location: string;
  image?: unknown;
  description: string;
}

export interface Trip2PickupVariantDoc {
  city: string;
  note: string;
  /** Ordered list of stop names for this pickup's route, e.g.
   * ["Delhi", "Udaipur", "Jaipur", "Delhi"] — mirrors `TripPickupVariantDoc`
   * in `lib/db/models/trip.model.ts` (v1). */
  route: string[];
  /** This pickup's own day-by-day itinerary, switched in on the public
   * page when the visitor picks this city (see
   * `components/trip/v2/pickup-variants-v2.tsx`). */
  itinerary: Trip2ItineraryDayDoc[];
}

export type Trip2BatchStatus = "open" | "filling-fast" | "sold-out";

export interface Trip2BatchDateDoc {
  startDate: string;
  endDate: string;
  seatsTotal: number;
  seatsAvailable: number;
  status: Trip2BatchStatus;
}

export interface Trip2ExperienceDoc {
  tag: string;
  title: string;
  description: string;
  href: string;
  image?: unknown;
}

export interface Trip2FactDoc {
  icon: string;
  title: string;
  description: string;
  href: string;
}

export interface Trip2FaqDoc {
  question: string;
  answer: string;
}

/** Admin-configurable background photo for a `SectionBackdropV2` wrapper,
 * with an overlay-opacity slider (0-100). Higher opacity = more of the
 * cream/tint colour and less of the photo showing through; this mirrors
 * the `bg-background/88` overlay `SectionBackdropV2` already hardcodes,
 * just made per-trip and admin-editable instead of a fixed constant. */
export interface Trip2SectionBackdropDoc {
  image?: unknown;
  opacity: number;
}

export interface Trip2SectionBackdropsDoc {
  /** Behind Quick Links + Hotel Tiers. */
  quickLinks?: Trip2SectionBackdropDoc;
  /** Behind Price + Pickup Variants + Batch Dates. */
  price?: Trip2SectionBackdropDoc;
}

export interface Trip2Document extends Document {
  slug: string;
  status: "draft" | "published";
  title: string;
  shortDescription: string;
  location: string;
  durationLabel: string;
  groupSizeLabel: string;
  heroImage?: unknown;
  /** Additional hero photos (Admin → Trip 2.0 → Hero Image → "Additional
   * Hero Images"). When non-empty, `TripHeroV2` renders a swipeable
   * gallery (dots + arrows + touch-swipe) instead of a single static
   * image, with `heroImage` always shown first. */
  heroImages: unknown[];
  bookHref: string;
  quickLinks: Trip2QuickLinkDoc[];
  gallery: Trip2GalleryImageDoc[];
  hotelTiers: Trip2HotelTierDoc[];
  itinerary: Trip2ItineraryDayDoc[];
  inclusions: string[];
  exclusions: string[];
  price: { basePrice: number; discountedPrice?: number; bookingAmount: number };
  pickupVariants: Trip2PickupVariantDoc[];
  batchDates: Trip2BatchDateDoc[];
  thingsToExperience: Trip2ExperienceDoc[];
  didYouKnow: Trip2FactDoc[];
  faqs: Trip2FaqDoc[];
  sectionBackdrops?: Trip2SectionBackdropsDoc;
  /** Prefills the "Let's Plan Your Trip" lead form's destination field.
   * Falls back to `title` when blank. */
  leadFormDestination: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const QuickLinkSchema = new Schema<Trip2QuickLinkDoc>(
  {
    icon: { type: String, default: "Sparkles" },
    label: { type: String, default: "" },
    href: { type: String, default: "#" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const GalleryImageSchema = new Schema<Trip2GalleryImageDoc>(
  {
    image: { type: ImageAssetSchema },
    caption: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const HotelTierSchema = new Schema<Trip2HotelTierDoc>(
  {
    stars: { type: Number, default: 3 },
    label: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const ItineraryDaySchema = new Schema<Trip2ItineraryDayDoc>(
  {
    day: { type: Number, default: 1 },
    title: { type: String, default: "" },
    location: { type: String, default: "" },
    image: { type: ImageAssetSchema },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const PickupVariantSchema = new Schema<Trip2PickupVariantDoc>(
  {
    city: { type: String, default: "" },
    note: { type: String, default: "" },
    route: { type: [String], default: [] },
    itinerary: { type: [ItineraryDaySchema], default: [] },
  },
  { _id: false }
);

const BatchDateSchema = new Schema<Trip2BatchDateDoc>(
  {
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    seatsTotal: { type: Number, default: 16 },
    seatsAvailable: { type: Number, default: 16 },
    status: { type: String, enum: ["open", "filling-fast", "sold-out"], default: "open" },
  },
  { _id: false }
);

const ExperienceSchema = new Schema<Trip2ExperienceDoc>(
  {
    tag: { type: String, default: "" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    href: { type: String, default: "#" },
    image: { type: ImageAssetSchema },
  },
  { _id: false }
);

const FactSchema = new Schema<Trip2FactDoc>(
  {
    icon: { type: String, default: "Globe2" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    href: { type: String, default: "#" },
  },
  { _id: false }
);

const FaqSchema = new Schema<Trip2FaqDoc>(
  {
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
  },
  { _id: false }
);

const SectionBackdropSchema = new Schema<Trip2SectionBackdropDoc>(
  {
    image: { type: ImageAssetSchema },
    opacity: { type: Number, default: 88 },
  },
  { _id: false }
);

const SectionBackdropsSchema = new Schema<Trip2SectionBackdropsDoc>(
  {
    quickLinks: { type: SectionBackdropSchema },
    price: { type: SectionBackdropSchema },
  },
  { _id: false }
);

const Trip2Schema = new Schema<Trip2Document>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    title: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    location: { type: String, default: "" },
    durationLabel: { type: String, default: "" },
    groupSizeLabel: { type: String, default: "" },
    heroImage: { type: ImageAssetSchema },
    heroImages: { type: [ImageAssetSchema], default: [] },
    bookHref: { type: String, default: "" },
    quickLinks: { type: [QuickLinkSchema], default: [] },
    gallery: { type: [GalleryImageSchema], default: [] },
    hotelTiers: { type: [HotelTierSchema], default: [] },
    itinerary: { type: [ItineraryDaySchema], default: [] },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    price: {
      basePrice: { type: Number, default: 0 },
      discountedPrice: { type: Number },
      bookingAmount: { type: Number, default: 0 },
    },
    pickupVariants: { type: [PickupVariantSchema], default: [] },
    batchDates: { type: [BatchDateSchema], default: [] },
    thingsToExperience: { type: [ExperienceSchema], default: [] },
    didYouKnow: { type: [FactSchema], default: [] },
    faqs: { type: [FaqSchema], default: [] },
    sectionBackdrops: { type: SectionBackdropsSchema },
    leadFormDestination: { type: String, default: "" },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const Trip2Model: Model<Trip2Document> = models.Trip2 || model<Trip2Document>("Trip2", Trip2Schema);
