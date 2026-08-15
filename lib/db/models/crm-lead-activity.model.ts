/**
 * CrmLeadActivity Mongoose model — the "clean timeline" from the roadmap
 * (LEAD TIMELINE section). One row per *meaningful* business event
 * (created, assigned, status change, follow-up scheduled, note added,
 * booking linked, etc.) — never a per-call log. The roadmap is explicit
 * about this: "DO NOT create hundreds of call entries. Only meaningful
 * events." `lib/crm/activity.ts` is the only place that writes here, so
 * every write path funnels through one helper instead of each API route
 * constructing timeline rows by hand.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;

export type CrmLeadActivityType =
  | "created"
  | "assigned"
  | "reassigned"
  | "status_changed"
  | "follow_up_scheduled"
  | "note_added"
  | "customer_replied"
  | "booking_linked"
  | "payment_received";

export interface CrmLeadActivityDocument extends Document {
  leadId: string; // CrmLead.leadId, not the Mongo _id — stable across the UI
  type: CrmLeadActivityType;
  message: string; // human-readable line for the timeline, e.g. "Status changed to Interested"
  actor?: string; // salesperson/admin name who caused this, if any
  meta?: Record<string, unknown>; // e.g. { from: "new", to: "contacted" }
  createdAt: string;
}

const CrmLeadActivitySchema = new Schema<CrmLeadActivityDocument>(
  {
    leadId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        "created",
        "assigned",
        "reassigned",
        "status_changed",
        "follow_up_scheduled",
        "note_added",
        "customer_replied",
        "booking_linked",
        "payment_received",
      ],
      required: true,
    },
    message: { type: String, required: true },
    actor: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CrmLeadActivityModel: Model<CrmLeadActivityDocument> =
  models.CrmLeadActivity || model<CrmLeadActivityDocument>("CrmLeadActivity", CrmLeadActivitySchema);
