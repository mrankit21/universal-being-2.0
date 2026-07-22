/**
 * Booking Engine — Phase 8 configuration (Book Your Slot / Reservation
 * Expiry / Remaining Payment Method).
 *
 * Nothing money- or timing-related for these features is hardcoded in
 * business logic. The two knobs that used to live only in a spec doc now
 * live here, sourced from environment variables so ops can change them
 * without touching code:
 *
 *   - `BOOKING_RESERVATION_EXPIRY_MINUTES` — how long an unpaid "Book Your
 *     Slot" reservation holds a seat before it auto-expires (default 15).
 *   - Trip-level "Book Your Slot Amount" itself is NOT here — it's
 *     per-trip, Admin-editable, and lives on `Trip.price.bookingAmount` in
 *     MongoDB (`lib/db/models/trip.model.ts`). This file only owns the
 *     *global* knobs that apply the same way across every trip.
 *
 * Every place that needs the expiry duration or the remaining-payment
 * method catalogue imports from here — never a literal `15` or a literal
 * `"cash-during-trip"` string scattered around route handlers.
 */

/** Minutes an unpaid slot reservation is held before auto-expiry.
 * Change `BOOKING_RESERVATION_EXPIRY_MINUTES` in the environment (10, 15,
 * 20, 30 — whatever) and every part of the system (order creation, the
 * client countdown, the cron sweep, lazy-expiry-on-read) picks it up
 * automatically. No code change, no redeploy of business logic. */
export function getReservationExpiryMinutes(): number {
  const raw = process.env.BOOKING_RESERVATION_EXPIRY_MINUTES;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 15; // sensible default, only used when the env var is unset/invalid
}

export function getReservationExpiryMs(): number {
  return getReservationExpiryMinutes() * 60 * 1000;
}

/**
 * Remaining Payment Method architecture (Feature 2). Only "Cash During
 * Trip" is actually collectible today — the rest are registered here so
 * the schema, validators, and admin UI already know about them and adding
 * a real implementation later (UPI intent, bank transfer reconciliation,
 * card-on-file, etc.) is additive, not a redesign.
 */
export const REMAINING_PAYMENT_METHODS = [
  "cash-during-trip",
  "upi",
  "bank-transfer",
  "card",
  "other",
] as const;

export type RemainingPaymentMethod = (typeof REMAINING_PAYMENT_METHODS)[number];

/** The only method that's actually wired up right now. Every booking gets
 * this by default; Admin can change it later per the requirement, but the
 * others are placeholders until their own implementation phase lands. */
export const DEFAULT_REMAINING_PAYMENT_METHOD: RemainingPaymentMethod = "cash-during-trip";

/** Which methods are actually usable today vs. reserved for future phases.
 * Keeps the "only implement Cash During Trip" instruction enforced in one
 * place instead of scattered feature-flag checks. */
export const IMPLEMENTED_REMAINING_PAYMENT_METHODS: RemainingPaymentMethod[] = ["cash-during-trip"];

export const REMAINING_PAYMENT_METHOD_LABELS: Record<RemainingPaymentMethod, string> = {
  "cash-during-trip": "Cash During Trip (Travelling Bus / Tour Start)",
  upi: "UPI (coming soon)",
  "bank-transfer": "Bank Transfer (coming soon)",
  card: "Card (coming soon)",
  other: "Other (coming soon)",
};

export const REMAINING_PAYMENT_STATUSES = ["pending", "received", "not-applicable"] as const;
export type RemainingPaymentStatus = (typeof REMAINING_PAYMENT_STATUSES)[number];
