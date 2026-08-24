/**
 * WebhookEvent Mongoose model — permanent audit log for every inbound
 * Meta webhook delivery (Lead Ads `leadgen` + WhatsApp `messages`),
 * written BEFORE signature verification or processing even starts.
 *
 * This is the single fix that makes "webhook silently didn't arrive /
 * didn't process" unable to happen invisibly again: whatever shows up
 * at the route — valid, bad signature, malformed JSON, or an exception
 * mid-processing — gets a row here first. The admin "Failed webhook
 * events" panel reads off `processed:false` rows to show what needs a
 * look, same pattern as `PaymentEventModel` (lib/db/models/payment-event.model.ts)
 * already uses for Razorpay.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;

export type WebhookEventSource = "meta-leads" | "whatsapp";

export interface WebhookEventDocument extends Document {
  source: WebhookEventSource;
  dedupeKey?: string; // leadgen_id or WhatsApp message.id — lets us tell "Meta retried this" apart from "brand new event"
  receivedAt: string;
  headers: Record<string, string>;
  rawBody: string;
  signatureValid?: boolean;
  processed: boolean;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const WebhookEventSchema = new Schema<WebhookEventDocument>(
  {
    source: { type: String, enum: ["meta-leads", "whatsapp"], required: true, index: true },
    dedupeKey: { type: String, index: true, sparse: true },
    receivedAt: { type: String, required: true },
    headers: { type: Schema.Types.Mixed },
    rawBody: { type: String, required: true },
    signatureValid: { type: Boolean },
    processed: { type: Boolean, default: false, index: true },
    error: { type: String },
  },
  { timestamps: true }
);

WebhookEventSchema.index({ source: 1, createdAt: -1 });

export const WebhookEventModel: Model<WebhookEventDocument> =
  models.WebhookEvent || model<WebhookEventDocument>("WebhookEvent", WebhookEventSchema);
