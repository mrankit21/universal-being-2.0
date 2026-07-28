import { z } from "zod";

/**
 * Promo popup lead capture — deliberately tiny (two fields) since this is a
 * marketing capture, not the full customer/booking form. WhatsApp numbers
 * are stored as bare 10 digits (no country code, no separators); the popup
 * UI is responsible for stripping everything else before it ever reaches
 * this schema, but we re-validate here too since the client is never
 * trusted.
 */
export const promoLeadCreateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(120, "That name looks too long"),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit WhatsApp number"),
  couponCode: z.string().trim().min(1).max(32),
  source: z.string().trim().max(64).optional(),
});

export type PromoLeadCreateInput = z.infer<typeof promoLeadCreateSchema>;
