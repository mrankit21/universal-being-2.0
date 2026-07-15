/**
 * Booking Mongoose model (Architecture §6).
 *
 * Extended for Phase 8 (Book Your Slot / Remaining Payment Method /
 * Booking Expiry Timer). Every new field is optional or has a default, so
 * bookings written before this migration still load and render fine.
 *
 * Payments are now wired up (`lib/payments/razorpay.ts`): a booking is
 * created as `slot-reserved` with `paymentStatus: "pending"`, a
 * `reservationExpiresAt` deadline, and (when Razorpay is configured) an
 * order for the Book Your Slot amount. `couponCode` / `discountAmount`
 * remain a forward-looking placeholder for a future Coupons/Promo Codes
 * phase — unused today beyond the price-breakdown discount already
 * computed from the trip's own price.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";
import {
  REMAINING_PAYMENT_METHODS,
  REMAINING_PAYMENT_STATUSES,
  DEFAULT_REMAINING_PAYMENT_METHOD,
  type RemainingPaymentMethod,
  type RemainingPaymentStatus,
} from "@/lib/config/booking-config";

/**
 * Booking lifecycle (Feature 3 / "BOOKING STATUS"):
 *
 *   pending -> slot-reserved -> slot-paid -> remaining-payment-pending
 *           -> remaining-payment-received -> completed
 *
 * plus the automatic side-state `expired`, and the admin-triggerable
 * `cancelled` / `refunded`. `pending`, `confirmed`, `completed`,
 * `cancelled` are the original statuses from the pre-Phase-8 skeleton and
 * are kept for backward compatibility with bookings written before this
 * migration.
 */
export type BookingStatus =
  | "pending"
  | "slot-reserved"
  | "slot-paid"
  | "remaining-payment-pending"
  | "remaining-payment-received"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "expired"
  | "refunded";

export type BookingPaymentStatus = "not-applicable" | "pending" | "paid" | "refunded" | "failed";
export type { RemainingPaymentMethod, RemainingPaymentStatus };

export interface BookingTraveler {
  fullName: string;
  age?: number;
  gender?: string;
  idProofType?: string;
  idProofNumber?: string;
}

export interface BookingStatusEvent {
  status: BookingStatus | string;
  note?: string;
  changedAt: string;
  changedBy?: string;
}

export interface BookingDocument extends Document {
  tripId: string;
  tripSlug: string;
  tripTitle: string;
  departureDateId: string;
  departureStartDate?: string;
  departureEndDate?: string;

  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerGender?: string;
  customerAge?: number;
  customerCity?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  specialRequests?: string;

  travelers: BookingTraveler[];
  seatsBooked: number;

  // Price breakdown — snapshotted at booking time (Part 4) so the record
  // stays accurate even if the trip's price changes later.
  offerPrice: number;
  originalPrice?: number;
  discountAmount: number;
  bookingAmountDue: number;
  remainingAmount: number;
  totalAmount: number;
  amountPaid: number;
  currency: string;

  status: BookingStatus;
  statusHistory: BookingStatusEvent[];
  paymentStatus: BookingPaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  couponCode?: string;
  notes?: string;

  // --- Feature 1: Book Your Slot — snapshot of the trip's admin-configured
  // slot amount at booking time, so it stays accurate even if the trip's
  // amount changes later. `bookingAmountDue` (existing field, above) is the
  // actual amount charged (this * seatsBooked, capped at totalAmount); this
  // field keeps the raw per-trip config value for reference/auditing.
  bookYourSlotAmountPerPerson: number;

  // --- Feature 2: Remaining Payment Method ---
  remainingPaymentMethod: RemainingPaymentMethod;
  remainingPaymentStatus: RemainingPaymentStatus;

  // --- Feature 3: Booking Expiry Timer ---
  reservationStartedAt?: string;
  reservationExpiresAt?: string;
  reservationExpiryMinutes?: number;

  // --- Step 8C additions (all optional / defaulted — backward compatible
  // with bookings written before this migration) ---

  // Part 3/4 — Payment Retry / Payment History. Every Razorpay order this
  // booking has ever had (initial + retries) is tracked here so the UI can
  // show "Attempt 1 / Attempt 2 / ..." without a separate join.
  paymentAttemptCount: number;

  // Part 5 — Coupon System. `discountAmount` above stays the trip-price
  // discount (batch override etc.); `couponDiscountAmount` is the
  // additional amount knocked off by a coupon, tracked separately so
  // reporting can distinguish "trip was on sale" from "customer used a
  // coupon".
  couponDiscountAmount: number;

  // Part 7 — Invoice System.
  invoiceId?: string;
  invoiceNumber?: string;

  // Part 8 — E-Ticket.
  ticketGeneratedAt?: string;

  // Part 6 — Refund System. Denormalized pointer to the latest refund for
  // quick admin-list display; the `Refund` collection is the source of
  // truth for the full record/timeline.
  latestRefundId?: string;
  latestRefundStatus?: "requested" | "approved" | "rejected" | "processed";

  // Part 11 — Admin Payment Management: free-text notes an admin attaches
  // when manually recording something (e.g. cash collected offline),
  // distinct from the customer-facing `notes` field above only by
  // convention (this one is always admin-authored).
  adminPaymentNotes?: string;

  createdAt: string;
  updatedAt: string;
}

const BookingTravelerSchema = new Schema<BookingTraveler>(
  {
    fullName: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    idProofType: { type: String },
    idProofNumber: { type: String },
  },
  { _id: false }
);

const BookingStatusEventSchema = new Schema<BookingStatusEvent>(
  {
    status: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    note: { type: String },
    changedAt: { type: String, required: true },
    changedBy: { type: String },
  },
  { _id: false }
);

const BookingSchema = new Schema<BookingDocument>(
  {
    tripId: { type: String, required: true, index: true },
    tripSlug: { type: String, required: true },
    tripTitle: { type: String, required: true },
    departureDateId: { type: String, required: true },
    departureStartDate: { type: String },
    departureEndDate: { type: String },

    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, index: true },
    customerPhone: { type: String, required: true },
    customerGender: { type: String },
    customerAge: { type: Number },
    customerCity: { type: String },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    specialRequests: { type: String },

    travelers: { type: [BookingTravelerSchema], default: [] },
    seatsBooked: { type: Number, required: true, default: 1 },

    offerPrice: { type: Number, required: true, default: 0 },
    originalPrice: { type: Number },
    discountAmount: { type: Number, required: true, default: 0 },
    bookingAmountDue: { type: Number, required: true, default: 0 },
    remainingAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: [
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
      ],
      default: "pending",
      index: true,
    },
    statusHistory: { type: [BookingStatusEventSchema], default: [] },
    paymentStatus: {
      type: String,
      enum: ["not-applicable", "pending", "paid", "refunded", "failed"],
      default: "not-applicable",
      index: true,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    couponCode: { type: String },
    notes: { type: String },

    // Feature 1 — auditable snapshot of the trip's Book Your Slot amount.
    bookYourSlotAmountPerPerson: { type: Number, default: 0 },

    // Feature 2 — Remaining Payment Method architecture. Only
    // "cash-during-trip" is actually collected today; the others exist so
    // the schema/admin UI don't need another migration when they land.
    remainingPaymentMethod: {
      type: String,
      enum: REMAINING_PAYMENT_METHODS,
      default: DEFAULT_REMAINING_PAYMENT_METHOD,
    },
    remainingPaymentStatus: {
      type: String,
      enum: REMAINING_PAYMENT_STATUSES,
      default: "pending",
    },

    // Feature 3 — Booking Expiry Timer. `reservationExpiryMinutes` is
    // stored per-booking (a snapshot of the config at booking time) so a
    // later change to the global default doesn't retroactively change the
    // deadline already promised to a customer mid-checkout.
    reservationStartedAt: { type: String },
    reservationExpiresAt: { type: String, index: true },
    reservationExpiryMinutes: { type: Number },

    // Step 8C additions — see interface comments above for rationale.
    paymentAttemptCount: { type: Number, default: 0 },
    couponDiscountAmount: { type: Number, default: 0 },
    invoiceId: { type: String },
    invoiceNumber: { type: String },
    ticketGeneratedAt: { type: String },
    latestRefundId: { type: String },
    latestRefundStatus: { type: String, enum: ["requested", "approved", "rejected", "processed"] },
    adminPaymentNotes: { type: String },
  },
  { timestamps: true }
);

BookingSchema.index({ createdAt: -1 });

export const BookingModel: Model<BookingDocument> =
  models.Booking || model<BookingDocument>("Booking", BookingSchema);
