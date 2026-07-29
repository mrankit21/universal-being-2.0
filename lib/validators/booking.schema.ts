import { z } from "zod";
import { REMAINING_PAYMENT_METHODS, REMAINING_PAYMENT_STATUSES } from "@/lib/config/booking-config";

export const bookingTravelerSchema = z.object({
  fullName: z.string().min(1, "Traveller name is required"),
  age: z.number().int().positive().max(120).optional(),
  gender: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
});

/**
 * Public booking-form submission (Booking Engine Foundation, Parts 1-3).
 * Server route (`app/api/bookings/route.ts`) still recomputes price from
 * the trip/departure itself (Part 4) — nothing money-related here is
 * trusted from the client beyond the traveller count implied by
 * `travelers.length`.
 */
export const bookingCreateSchema = z
  .object({
    tripId: z.string().min(1),
    tripSlug: z.string().min(1),
    departureDateId: z.string().min(1),
    // Pickup Variant Architecture (2026-07). Purely informational — which
    // pickup city the visitor picked, snapshotted onto the Booking for
    // Admin's reference. Never trusted for price/seat resolution: the
    // server still resolves those from `departureDateId` exactly as
    // before, so an incorrect/missing value here can't affect what's
    // charged or reserved.
    pickupVariantId: z.string().optional(),

    customerName: z.string().min(2, "Full name is required"),
    customerEmail: z.string().email("Enter a valid email"),
    customerPhone: z
      .string()
      .min(7, "Enter a valid phone number")
      .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number"),
    customerGender: z.string().optional(),
    customerAge: z.number().int().positive().max(120).optional(),
    customerCity: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z
      .string()
      .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
    specialRequests: z.string().max(2000).optional(),

    // Part 5 — Coupon System. Optional; server re-validates against
    // authoritative pricing rather than trusting a client-side discount.
    couponCode: z.string().min(1).max(32).optional(),

    travelers: z.array(bookingTravelerSchema).min(1, "Add at least one traveller"),
  })
  .refine((data) => data.travelers.length >= 1, {
    message: "At least one traveller is required",
    path: ["travelers"],
  });

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const bookingUpdateSchema = z.object({
  status: z
    .enum([
      "pending",
      "slot-reserved",
      "slot-paid",
      "remaining-payment-pending",
      "remaining-payment-received",
      "confirmed",
      "completed",
      "cancelled",
      "expired",
      "refunded",
    ])
    .optional(),
  paymentStatus: z.enum(["not-applicable", "pending", "paid", "refunded", "failed"]).optional(),
  notes: z.string().optional(),
  amountPaid: z.number().min(0).optional(),
  statusNote: z.string().optional(),
  // Feature 2 — Admin can change the remaining-payment method/status later.
  remainingPaymentMethod: z.enum(REMAINING_PAYMENT_METHODS).optional(),
  remainingPaymentStatus: z.enum(REMAINING_PAYMENT_STATUSES).optional(),
});

export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
