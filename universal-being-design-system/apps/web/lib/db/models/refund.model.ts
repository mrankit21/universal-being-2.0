/**
 * Refund Mongoose model (Step 8C, Part 6 — Refund System).
 *
 * Lifecycle: requested -> approved -> processed, or requested -> rejected.
 * "No manual database editing" (spec) means every transition happens
 * through `/api/admin/refunds/[id]` (or the customer-facing request
 * endpoint for the initial `requested` state) so `timeline` always reflects
 * exactly what happened and who did it.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";

export type RefundStatus = "requested" | "approved" | "rejected" | "processed";

export interface RefundTimelineEvent {
  status: RefundStatus;
  note?: string;
  actedBy?: string; // admin email, or "customer" for the initial request
  at: string;
}

export interface RefundDocument extends Document {
  bookingId: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  timeline: RefundTimelineEvent[];
  requestedBy: string; // customer email
  createdAt: string;
  updatedAt: string;
}

const RefundTimelineSchema = new Schema<RefundTimelineEvent>(
  {
    status: { type: String, enum: ["requested", "approved", "rejected", "processed"], required: true },
    note: { type: String },
    actedBy: { type: String },
    at: { type: String, required: true },
  },
  { _id: false }
);

const RefundSchema = new Schema<RefundDocument>(
  {
    bookingId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String },
    razorpayRefundId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "processed"],
      default: "requested",
      index: true,
    },
    timeline: { type: [RefundTimelineSchema], default: [] },
    requestedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const RefundModel: Model<RefundDocument> =
  models.Refund || model<RefundDocument>("Refund", RefundSchema);
