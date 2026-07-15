/**
 * Shared Mongoose sub-schemas mirroring `types/trip.ts`'s `ImageAsset` and
 * other cross-collection value objects (Architecture §13: "components never
 * know an image's URL... they only know an ImageAsset object"). Defined once
 * here and reused with `{ _id: false }` so every collection stores the exact
 * same shape the frontend types already expect — zero mapping layer needed
 * between Mongoose documents and the `Trip`/`Destination` TS types.
 */
import { Schema } from "mongoose";

export const ImageAssetSchema = new Schema(
  {
    // "cloudinary" is kept in the enum only so pre-migration embedded
    // ImageAssets (on existing Trip/Destination/Homepage docs) still
    // validate — new writes use "imagekit".
    provider: {
      type: String,
      enum: ["imagekit", "cloudinary", "local", "placeholder"],
      required: true,
      default: "placeholder",
    },
    publicId: { type: String },
    url: { type: String, required: true, default: "" },
    alt: { type: String, required: true, default: "" },
    width: { type: Number, required: true, default: 1600 },
    height: { type: Number, required: true, default: 900 },
    blurHash: { type: String },
    focalPoint: {
      x: { type: Number },
      y: { type: Number },
    },
    isPlaceholder: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

export const SeoSchema = new Schema(
  {
    title: { type: String, required: true, default: "" },
    description: { type: String, required: true, default: "" },
    ogImage: { type: ImageAssetSchema, required: false },
    keywords: { type: [String], default: [] },
    canonicalUrl: { type: String },
  },
  { _id: false }
);
