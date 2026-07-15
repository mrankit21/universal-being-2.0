/**
 * Invoice Mongoose model (Step 8C, Part 7 — Invoice System).
 *
 * One invoice per booking (created the first time a payment on that
 * booking is captured — see `lib/payments/invoicing.ts`), numbered via the
 * atomic `Counter` model as `UB-2026-000001`. The PDF itself isn't stored
 * in Mongo — it's generated on demand by `lib/pdf/invoice-pdf.ts` from this
 * document's data plus the booking, so re-issuing after an admin edits
 * something never requires a separate regeneration step.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";

export type InvoiceStatus = "issued" | "cancelled";

export interface InvoiceDocument extends Document {
  bookingId: string;
  invoiceNumber: string;
  issuedAt: string;
  status: InvoiceStatus;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  tripTitle: string;
  departureStartDate?: string;
  departureEndDate?: string;
  seatsBooked: number;
  subtotal: number;
  discountAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  gstin?: string;
  createdAt: string;
  updatedAt: string;
}

const InvoiceSchema = new Schema<InvoiceDocument>(
  {
    bookingId: { type: String, required: true, index: true, unique: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    issuedAt: { type: String, required: true },
    status: { type: String, enum: ["issued", "cancelled"], default: "issued" },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    tripTitle: { type: String, required: true },
    departureStartDate: { type: String },
    departureEndDate: { type: String },
    seatsBooked: { type: Number, required: true, default: 1 },
    subtotal: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    gstRatePercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, required: true, default: 0 },
    balanceDue: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "INR" },
    gstin: { type: String },
  },
  { timestamps: true }
);

export const InvoiceModel: Model<InvoiceDocument> =
  models.Invoice || model<InvoiceDocument>("Invoice", InvoiceSchema);
