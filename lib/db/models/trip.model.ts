/**
 * Trip Mongoose model — mirrors `types/trip.ts` (Architecture §3/§6/§13/§14).
 * One document per Trip page at `/trips/[slug]` (the original Trip Editor,
 * distinct from `Trip2Model`'s `/trip2/[slug]` pages — see `trip2.model.ts`
 * doc comment). Field groups map 1:1 to `Trip` in `types/trip.ts` and the
 * Zod schema in `lib/validators/trip.schema.ts`, which remains the single
 * source of truth for validation; this file only needs to persist the same
 * shape.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;
import { ImageAssetSchema, SeoSchema } from "./shared.schemas";

export interface TripDayPlanDoc {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: ("breakfast" | "lunch" | "dinner")[];
  stay?: string;
  location?: string;
  images: unknown[];
}

export interface TripDepartureDateDoc {
  id: string;
  startDate: string;
  endDate: string;
  seatsTotal: number;
  seatsAvailable: number;
  priceOverride?: number;
  status: "open" | "filling-fast" | "sold-out" | "closed";
  isPublished?: boolean;
  pickupVariantId?: string;
  bookingAmountOverride?: number;
}

export interface TripAccommodationEntryDoc {
  id: string;
  hotelName: string;
  roomType: string;
  roomSharing?: string;
  amenities?: string[];
  location?: string;
  notes?: string;
  images: unknown[];
}

export interface TripMealPlanDoc {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snacks: boolean;
  description: string;
}

export interface TripHotelCategoryDoc {
  id: string;
  stars: 0 | 3 | 4 | 5;
  title: string;
  shortDescription?: string;
  isEnabled: boolean;
}

export interface TripFaqDoc {
  id: string;
  question: string;
  answer: string;
}

export interface TripReviewDoc {
  id: string;
  customerName: string;
  customerPhoto: unknown;
  rating: number;
  reviewText: string;
  reviewDate?: string;
}

export interface TripDestinationRouteDoc {
  id: string;
  stops: string[];
  href?: string;
}

export interface TripPickupVariantDoc {
  id: string;
  name: string;
  pickupCity: string;
  dropCity: string;
  route: string[];
  duration: { days: number; nights: number; label: string };
  startingPrice: number;
  discountedPrice?: number;
  bookingAmount: number;
  gstNote?: string;
  paymentNote?: string;
  itinerary: TripDayPlanDoc[];
  status?: "active" | "draft" | "archived";
  isPublished?: boolean;
  isDefault?: boolean;
}

export interface TripDocument extends Document {
  slug: string;
  title: string;

  destinationSlug: string;
  destinationName: string;

  themeKey: string;

  shortDescription: string;
  fullDescription: string;

  heroImage: unknown;
  heroImageMobile?: unknown;
  coverImage: unknown;
  thumbnail: unknown;
  homepageHeroImage: unknown;
  gallery: unknown[];

  duration: { days: number; nights: number; label: string };
  difficulty: "easy" | "moderate" | "challenging";
  bestSeason: string[];
  bestTimeToVisit?: string;
  altitude?: string;
  groupSize: { min: number; max: number };
  pickup: string;
  drop: string;
  startingCity?: string;
  endingCity?: string;
  vehicle: string;
  travelNotes?: string;

  accommodation: TripAccommodationEntryDoc[];
  mealPlan: TripMealPlanDoc;

  price: {
    base: number;
    discounted?: number;
    bookingAmount: number;
    currency: string;
    sharingTypeMarkup?: { double?: number; triple?: number };
  };

  circuitGroup?: string;
  isCircuitParent?: boolean;
  destinationRoutes?: TripDestinationRouteDoc[];

  pickupVariants?: TripPickupVariantDoc[];
  hotelCategories?: TripHotelCategoryDoc[];

  totalSeats: number;
  availableSeats: number;
  departureDates: TripDepartureDateDoc[];

  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  itinerary: TripDayPlanDoc[];
  faqs: TripFaqDoc[];
  reviews: TripReviewDoc[];
  reviewIds: string[];
  termsAndConditions: string[];
  cancellationPolicy: string;

  mapEmbedUrl?: string;
  mapQuery: string;

  rating: number;
  reviewCount: number;

  featured: boolean;
  status: "draft" | "published" | "archived";
  activeVersion?: "v1" | "v2";

  seo: unknown;

  isPlaceholderContent: boolean;

  /** Admin audit fields — who created/last-edited this Trip document.
   * Set from the requesting session's email on every write (see
   * app/api/admin/trips/route.ts and [id]/route.ts). */
  createdBy?: string;
  updatedBy?: string;

  createdAt: string;
  updatedAt: string;
}

const DayPlanSchema = new Schema<TripDayPlanDoc>(
  {
    day: { type: Number, required: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    activities: { type: [String], default: [] },
    meals: { type: [String], enum: ["breakfast", "lunch", "dinner"], default: [] },
    stay: { type: String },
    location: { type: String },
    images: { type: [ImageAssetSchema], default: [] },
  },
  { _id: false }
);

const DepartureDateSchema = new Schema<TripDepartureDateDoc>(
  {
    id: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    seatsTotal: { type: Number, default: 0 },
    seatsAvailable: { type: Number, default: 0 },
    priceOverride: { type: Number },
    status: { type: String, enum: ["open", "filling-fast", "sold-out", "closed"], default: "open" },
    isPublished: { type: Boolean, default: true },
    // Pickup Variant Architecture (2026-07) — see types/trip.ts DepartureDate doc.
    pickupVariantId: { type: String },
    bookingAmountOverride: { type: Number },
  },
  { _id: false }
);

const AccommodationEntrySchema = new Schema<TripAccommodationEntryDoc>(
  {
    id: { type: String, required: true },
    hotelName: { type: String, default: "" },
    roomType: { type: String, default: "" },
    roomSharing: { type: String },
    amenities: { type: [String], default: [] },
    location: { type: String },
    notes: { type: String },
    images: { type: [ImageAssetSchema], default: [] },
  },
  { _id: false }
);

const MealPlanSchema = new Schema<TripMealPlanDoc>(
  {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    snacks: { type: Boolean, default: false },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const HotelCategorySchema = new Schema<TripHotelCategoryDoc>(
  {
    id: { type: String, required: true },
    stars: { type: Number, enum: [0, 3, 4, 5], required: true },
    title: { type: String, default: "" },
    shortDescription: { type: String },
    isEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const FaqSchema = new Schema<TripFaqDoc>(
  {
    id: { type: String, required: true },
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
  },
  { _id: false }
);

const TripReviewSchema = new Schema<TripReviewDoc>(
  {
    id: { type: String, required: true },
    customerName: { type: String, default: "" },
    customerPhoto: { type: ImageAssetSchema },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    reviewText: { type: String, default: "" },
    reviewDate: { type: String },
  },
  { _id: false }
);

const DestinationRouteSchema = new Schema<TripDestinationRouteDoc>(
  {
    id: { type: String, required: true },
    stops: { type: [String], default: [] },
    href: { type: String },
  },
  { _id: false }
);

// Pickup Variant Architecture (2026-07) — see types/trip.ts PickupVariant doc.
const PickupVariantSchema = new Schema<TripPickupVariantDoc>(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    pickupCity: { type: String, default: "" },
    dropCity: { type: String, default: "" },
    route: { type: [String], default: [] },
    duration: {
      days: { type: Number, default: 1 },
      nights: { type: Number, default: 0 },
      label: { type: String, default: "" },
    },
    startingPrice: { type: Number, default: 0 },
    discountedPrice: { type: Number },
    bookingAmount: { type: Number, default: 0 },
    gstNote: { type: String },
    paymentNote: { type: String },
    itinerary: { type: [DayPlanSchema], default: [] },
    status: { type: String, enum: ["active", "draft", "archived"], default: "active" },
    // Deprecated — kept for variants saved before `status` existed.
    isPublished: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const TripSchema = new Schema<TripDocument>(
  {
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },

    destinationSlug: { type: String, required: true, index: true },
    destinationName: { type: String, required: true, default: "" },

    themeKey: {
      type: String,
      required: true,
      enum: ["brand", "rajasthan", "winter", "monsoon", "beach", "mountain", "forest", "udaipur", "spiti", "manali", "goa", "jibhi"],
    },

    shortDescription: { type: String, default: "" },
    fullDescription: { type: String, default: "" },

    heroImage: { type: ImageAssetSchema, required: true },
    heroImageMobile: { type: ImageAssetSchema },
    coverImage: { type: ImageAssetSchema, required: true },
    thumbnail: { type: ImageAssetSchema, required: true },
    homepageHeroImage: { type: ImageAssetSchema, required: true },
    gallery: { type: [ImageAssetSchema], default: [] },

    duration: {
      days: { type: Number, required: true },
      nights: { type: Number, required: true },
      label: { type: String, default: "" },
    },
    difficulty: { type: String, enum: ["easy", "moderate", "challenging"], required: true },
    bestSeason: { type: [String], default: [] },
    bestTimeToVisit: { type: String },
    altitude: { type: String },
    groupSize: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 1 },
    },
    pickup: { type: String, default: "" },
    drop: { type: String, default: "" },
    startingCity: { type: String },
    endingCity: { type: String },
    vehicle: { type: String, default: "" },
    travelNotes: { type: String },

    accommodation: { type: [AccommodationEntrySchema], default: [] },
    mealPlan: {
      type: MealPlanSchema,
      default: { breakfast: false, lunch: false, dinner: false, snacks: false, description: "" },
    },

    price: {
      base: { type: Number, required: true, default: 0 },
      discounted: { type: Number },
      bookingAmount: { type: Number, required: true, default: 0 },
      currency: { type: String, default: "INR" },
      // Room Sharing markup (2026-07) — deliberately no schema-level default,
      // see lib/validators/trip.schema.ts comment on the same field.
      sharingTypeMarkup: {
        double: { type: Number },
        triple: { type: Number },
      },
    },

    circuitGroup: { type: String, trim: true, index: true },
    isCircuitParent: { type: Boolean, default: false },
    destinationRoutes: { type: [DestinationRouteSchema], default: [] },

    // Pickup Variant Architecture (2026-07).
    pickupVariants: { type: [PickupVariantSchema], default: [] },
    // Hotel Category Architecture (2026-07).
    hotelCategories: { type: [HotelCategorySchema], default: [] },

    totalSeats: { type: Number, default: 0 },
    availableSeats: { type: Number, default: 0 },
    departureDates: { type: [DepartureDateSchema], default: [] },

    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    itinerary: { type: [DayPlanSchema], default: [] },
    faqs: { type: [FaqSchema], default: [] },
    reviews: { type: [TripReviewSchema], default: [] },
    reviewIds: { type: [String], default: [] },
    termsAndConditions: { type: [String], default: [] },
    cancellationPolicy: { type: String, default: "" },

    mapEmbedUrl: { type: String },
    mapQuery: { type: String, default: "" },

    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },

    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    // "Active Homepage"-style switch, but per-trip — see types/trip.ts doc.
    activeVersion: { type: String, enum: ["v1", "v2"], default: "v1" },

    seo: { type: SeoSchema, required: true },

    isPlaceholderContent: { type: Boolean, default: false },

    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const TripModel: Model<TripDocument> = models.Trip || model<TripDocument>("Trip", TripSchema);
