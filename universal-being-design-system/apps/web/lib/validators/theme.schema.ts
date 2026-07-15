import { z } from "zod";
import { themeKeySchema } from "./shared.schema";

export const themeUpdateSchema = z.object({
  key: themeKeySchema,
  name: z.string().min(1).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  isSeasonal: z.boolean().optional(),
  seasonalStart: z.string().optional(),
  seasonalEnd: z.string().optional(),
  isActiveHomepageTheme: z.boolean().optional(),
});

export type ThemeUpdateInput = z.infer<typeof themeUpdateSchema>;
