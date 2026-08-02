/**
 * PaymentEvent Mongoose model (Step 8C, Parts 1 + 4 + 12).
 *
 * Two jobs in one collection:
 *   1. Razorpay Webhook log — every inbound webhook delivery is stored
 *      here (raw event id, type, payload) BEFORE being processed, keyed
 *      uniquely on Razorpay's own `event id` header equivalent
 *      (`razorpayEventId`). That unique index is what makes webhook
 *      processing idempotent: Razorpay retries deliveries, and a unique
 *      index violation on a duplicate is treated as "already handled",
 *      not an error (Part 12 — "Prevent Duplicate Webhooks").
 *   2. Payment History — every attempt (order created, checkout opened,
 *      captured, failed, refunded) against a booking, so
 *      `GET /api/bookings/[id]` and the admin panel can show a complete
 *      timeline without re-deriving it from Razorpay each time.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;

export type PaymentEventSource = "webhook" | "verify" | "retry" | "refund" | "manual" | "admin";
export type PaymentEventType =
  | "order.created"
  | "payment.captured"
  | "payment.failed"
  | "order.paid"
  | "refund.created"
  | "refund.processed"
  | "manual.remaining-payment";

export interface PaymentEventDocument extends Document {
  bookingId: string;
  razorpayEventId?: string; // dedupe key for webhook deliveries
  type: PaymentEventType | string;
  source: PaymentEventSource;
  orderId?: string;
  paymentId?: string;
  refundId?: string;
  amount?: number;
  currency?: string;
  method?: string;
  status?: string;
  attemptNumber?: number;
  notes?: string;
  rawPayload?: unknown;
  processedAt: string;
  createdAt: string;
  updatedAt: string;
}

const PaymentEventSchema = new Schema<PaymentEventDocument>(
  {
    bookingId: { type: String, required: true, index: true },
    razorpayEventId: { type: String, index: true, sparse: true, unique: true },
    type: { type: String, required: true },
    source: {
      type: String,
      enum: ["webhook", "verify", "retry", "refund", "manual", "admin"],
      required: true,
    },
    orderId: { type: String },
    paymentId: { type: String },
    refundId: { type: String },
    amount: { type: Number },
    currency: { type: String, default: "INR" },
    method: { type: String },
    status: { type: String },
    attemptNumber: { type: Number },
    notes: { type: String },
    rawPayload: { type: Schema.Types.Mixed },
    processedAt: { type: String, required: true },
  },
  { timestamps: true }
);

PaymentEventSchema.index({ bookingId: 1, createdAt: -1 });

export const PaymentEventModel: Model<PaymentEventDocument> =
  models.PaymentEvent || model<PaymentEventDocument>("PaymentEvent", PaymentEventSchema);
