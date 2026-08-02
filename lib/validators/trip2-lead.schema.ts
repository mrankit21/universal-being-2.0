import { z } from "zod";

/**
 * "Let's Plan Your Trip" lead capture — public, unauthenticated submit
 * from `LetsPlanYourTripV2`. Same bare-10-digit WhatsApp convention as
 * `promo-lead.schema.ts`; the client strips formatting before it ever
 * reaches here, but the server re-validates since the client isn't
 * trusted.
 */
export const trip2LeadCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120, "That name looks too long"),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit WhatsApp number"),
  destination: z.string().trim().min(1, "Destination is required").max(160),
  travelTiming: z.string().trim().max(160).optional(),
  tripSlug: z.string().trim().max(160).optional(),
  source: z.string().trim().max(64).optional(),
});

export type Trip2LeadCreateInput = z.infer<typeof trip2LeadCreateSchema>;
