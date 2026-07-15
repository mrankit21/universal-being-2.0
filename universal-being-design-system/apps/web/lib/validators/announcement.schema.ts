import { z } from "zod";
import { imageAssetSchema } from "./shared.schema";

export const announcementSchema = z.object({
  kind: z.enum(["trip", "offer", "coupon", "limited-seats", "festival"]),
  message: z.string().min(1),
  href: z.string().optional(),
  linkLabel: z.string().optional(),
  dismissible: z.boolean().default(true),
  enabled: z.boolean().default(true),
  expiresAt: z.string().optional(),
  image: imageAssetSchema.optional(),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
export const announcementUpdateSchema = announcementSchema.partial();
