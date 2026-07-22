/** Testimonial Mongoose model — backs `data/home/testimonials.ts` (Architecture §14). */
import { Schema, model, models, type Model, type Document } from "mongoose";
import { ImageAssetSchema } from "./shared.schemas";

export interface TestimonialDocument extends Document {
  authorName: string;
  authorLocation?: string;
  avatar?: unknown;
  quote: string;
  rating: number;
  tripSlug?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const TestimonialSchema = new Schema<TestimonialDocument>(
  {
    authorName: { type: String, required: true },
    authorLocation: { type: String },
    avatar: { type: ImageAssetSchema },
    quote: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    tripSlug: { type: String },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const TestimonialModel: Model<TestimonialDocument> =
  models.Testimonial || model<TestimonialDocument>("Testimonial", TestimonialSchema);
