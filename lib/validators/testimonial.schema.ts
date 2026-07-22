import { z } from "zod";
import { imageAssetSchema } from "./shared.schema";

export const testimonialSchema = z.object({
  authorName: z.string().min(1),
  authorLocation: z.string().optional(),
  avatar: imageAssetSchema.optional(),
  quote: z.string().min(1),
  rating: z.number().int().min(1).max(5).default(5),
  tripSlug: z.string().optional(),
  published: z.boolean().default(true),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
export const testimonialUpdateSchema = testimonialSchema.partial();
