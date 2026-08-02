/**
 * Trip Mongoose model — the persisted mirror of `types/trip.ts`'s `Trip`
 * interface (Architecture §3). Field-for-field identical to the TS type so
 * `lib/api/trips.ts` can hand a `.lean<Trip>()` result straight to components
 * with no mapping layer, exactly as the "ONE Trip type" comment in
 * `types/trip.ts` anticipates.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;
import { ImageAssetSchema, SeoSchema } from "./shared.schemas";

const DayPlanSchema = new Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true, default: "" },
    activities: { type: [String], default: [] },
    meals: { type: [String], enum: ["breakfast", "lunch", "dinner"], default: [] },
    stay: { type: String },
    location: { type: String },
    images: { type: [ImageAssetSchema], default: [] },
  },
  { _id: false }
);

const DepartureDateSchema = new Schema(
  {
    id: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    seatsTotal: { type: Number, required: true, default: 0 },
    seatsAvailable: { type: Number, required: true, default: 0 },
    priceOverride: { type: Number },
    status: {
      type: String,
      enum: ["open", "filling-fast", "sold-out", "closed"],
      default: "open",
    },
    isPublished: { type: Boolean, default: true },
    // Pickup Variant Architecture (2026-07) — see types/trip.ts DepartureDate doc.
    pickupVariantId: { type: String },
    bookingAmountOverride: { type: Number },
  },
  { _id: false }
);

const PickupVariantSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, default: "" },
    pickupCity: { type: String, required: true, default: "" },
    dropCity: { type: String, required: true, default: "" },
    route: { type: [String], default: [] },
    duration: {
      days: { type: Number, required: true, default: 1 },
      nights: { type: Number, required: true, default: 0 },
      label: { type: String, required: true, default: "" },
    },
    startingPrice: { type: Number, required: true, default: 0 },
    discountedPrice: { type: Number },
    bookingAmount: { type: Number, required: true, default: 0 },
    gstNote: { type: String },
    paymentNote: { type: String },
    itinerary: { type: [DayPlanSchema], default: [] },
    // Pickup Variant Architecture — Phase 1 completion (2026-07).
    // `isPublished` kept (deprecated) for any variant saved before `status`
    // existed; `status` is the source of truth going forward — see
    // `getEffectiveVariantStatus` in lib/trip/pickup-variants.ts.
    isPublished: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "draft", "archived"], default: "active" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const HotelCategorySchema = new Schema(
  {
    id: { type: String, required: true },
    stars: { type: Number, enum: [0, 3, 4, 5], required: true },
    title: { type: String, required: true, default: "" },
    shortDescription: { type: String },
    isEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const FaqSchema = new Schema(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const AccommodationEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    hotelName: { type: String, required: true, default: "" },
    roomType: { type: String, required: true, default: "" },
    roomSharing: { type: String },
    amenities: { type: [String], default: [] },
    location: { type: String },
    notes: { type: String },
    images: { type: [ImageAssetSchema], default: [] },
  },
  { _id: false }
);

const MealPlanSchema = new Schema(
  {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    snacks: { type: Boolean, default: false },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const DestinationRouteSchema = new Schema(
  {
    id: { type: String, required: true },
    stops: { type: [String], default: [] },
    href: { type: String },
  },
  { _id: false }
);

const TripReviewSchema = new Schema(
  {
    id: { type: String, required: true },
    customerName: { type: String, required: true, default: "" },
    customerPhoto: { type: ImageAssetSchema, required: true },
    rating: { type: Number, required: true, default: 5, min: 1, max: 5 },
    reviewText: { type: String, required: true, default: "" },
    reviewDate: { type: String },
  },
  { _id: false }
);

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
  accommodation: unknown[];
  mealPlan: unknown;
  price: {
    base: number;
    discounted?: number;
    bookingAmount: number;
    currency: string;
    sharingTypeMarkup?: { double?: number; triple?: number };
  };
  /** See `Trip.circuitGroup` doc comment in `types/trip.ts`. */
  circuitGroup?: string;
  /** See `Trip.isCircuitParent` doc comment in `types/trip.ts`. Now wired
   * end-to-end (schema/validator/admin form) — an admin explicitly marks
   * ONE Trip per `circuitGroup` as the parent instead of the old implicit
   * "shortest duration wins" guess. */
  isCircuitParent?: boolean;
  destinationRoutes?: unknown[];
  pickupVariants?: unknown[];
  hotelCategories?: unknown[];
  totalSeats: number;
  availableSeats: number;
  departureDates: unknown[];
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  itinerary: unknown[];
  faqs: unknown[];
  reviews: unknown[];
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
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const TripSchema = new Schema<TripDocument>(
  {
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },

    destinationSlug: { type: String, required: true, index: true },
    destinationName: { type: String, required: true },

    themeKey: {
      type: String,
      required: true,
      enum: ["brand", "rajasthan", "winter", "monsoon", "beach", "mountain", "forest", "udaipur", "spiti", "manali", "goa", "jibhi"],
    },

    shortDescription: { type: String, required: true, default: "" },
    fullDescription: { type: String, required: true, default: "" },

    heroImage: { type: ImageAssetSchema, required: true },
    heroImageMobile: { type: ImageAssetSchema },
    coverImage: { type: ImageAssetSchema, required: true },
    thumbnail: { type: ImageAssetSchema, required: true },
    homepageHeroImage: { type: ImageAssetSchema, required: true },
    gallery: { type: [ImageAssetSchema], default: [] },

    duration: {
      days: { type: Number, required: true, default: 1 },
      nights: { type: Number, required: true, default: 0 },
      label: { type: String, required: true, default: "" },
    },
    difficulty: { type: String, enum: ["easy", "moderate", "challenging"], default: "easy" },
    bestSeason: { type: [String], default: [] },
    bestTimeToVisit: { type: String },
    altitude: { type: String },
    groupSize: {
      min: { type: Number, required: true, default: 2 },
      max: { type: Number, required: true, default: 12 },
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
      required: true,
      default: () => ({ breakfast: false, lunch: false, dinner: false, snacks: false, description: "" }),
    },

    price: {
      base: { type: Number, required: true, default: 0 },
      discounted: { type: Number },
      bookingAmount: { type: Number, required: true, default: 0 },
      currency: { type: String, required: true, default: "INR" },
      // Room Sharing markup (2026-07) — see types/trip.ts SharingTypeMarkup
      // doc comment. No schema-level default on purpose; absent entirely on
      // trips saved before this shipped, which computeBookingPricing treats
      // as 0/0.
      sharingTypeMarkup: {
        double: { type: Number },
        triple: { type: Number },
      },
    },

    circuitGroup: { type: String, index: true, trim: true },
    isCircuitParent: { type: Boolean, default: false, index: true },
    destinationRoutes: { type: [DestinationRouteSchema], default: [] },
    pickupVariants: { type: [PickupVariantSchema], default: [] },
    hotelCategories: { type: [HotelCategorySchema], default: [] },

    totalSeats: { type: Number, required: true, default: 0 },
    availableSeats: { type: Number, required: true, default: 0 },
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

    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    // "Active Homepage"-style switch (Site Settings), but per-trip: which
    // page design is live at `/trips/[slug]` for this trip. "v2" only
    // takes effect once a published `Trip2` document with the same slug
    // exists — see `app/trips/[slug]/page.tsx`. Added 2026-08.
    activeVersion: { type: String, enum: ["v1", "v2"], default: "v1" },

    seo: { type: SeoSchema, required: true },

    isPlaceholderContent: { type: Boolean, default: false },

    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

TripSchema.index({ title: "text", shortDescription: "text", destinationName: "text" });

export const TripModel: Model<TripDocument> = models.Trip || model<TripDocument>("Trip", TripSchema);
