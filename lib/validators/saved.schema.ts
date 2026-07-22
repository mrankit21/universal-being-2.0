import { z } from "zod";

export const savedItemCreateSchema = z.object({
  itemType: z.enum(["trip", "destination"]),
  itemSlug: z.string().min(1),
});

export type SavedItemCreateInput = z.infer<typeof savedItemCreateSchema>;
