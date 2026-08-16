/**
 * CrmLead Mongoose model — Phase 1 (CRM Foundation) of the Universal
 * Being CRM / Lead Management System roadmap.
 *
 * This is the new, full sales-pipeline lead record. It is deliberately
 * kept separate from the pre-existing `Trip2LeadModel` / `PromoLeadModel`
 * (see those files) rather than replacing them — those two collections
 * still exist and are still what `/admin/leads` (the older lightweight
 * follow-up queue) reads. As of Phase 6, `/api/trip2-leads` and
 * `/api/promo-leads` dual-write: every "Let's Plan Your Trip" / promo
 * popup submission creates both a `Trip2Lead`/`PromoLead` row (unchanged)
 * AND a `CrmLead` row (via `ingestExternalLead()`), so the full pipeline
 * sees every website enquiry without the older admin page breaking.
 * Meta Lead Ads (Phase 5) and WhatsApp (Phase 6) populate this
 * automatically too; manual entry (Admin -> CRM -> New Lead) always did.
 *
 * `leadId` is a short human-facing code ("LD-2026-0001") generated via
 * `lib/crm/id.ts` on the atomic `Counter` collection — same pattern as
 * invoice numbering (`lib/payments/invoicing.ts`).
 *
 * Per the roadmap's explicit "DO NOT" list, this model intentionally has
 * NO call-count, call-duration, or call-recording fields, and no
 * per-call history — only the two timestamps the roadmap calls out
 * (`lastActivityAt` vs `lastCustomerReplyAt`) plus whatever meaningful
 * business events land in `CrmLeadActivityModel`.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;
import { CRM_LEAD_STATUSES, CRM_LEAD_SOURCES, type CrmLeadStatus, type CrmLeadSource } from "@/lib/crm/constants";

export interface CrmLeadDocument extends Document {
  leadId: string; // "LD-2026-0001"

  // Customer info
  name: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;

  // Trip interest (free text in Phase 1 — not tied to a Trip/Trip2 doc yet,
  // since a lead may enquire before a matching trip exists in the catalog)
  destination?: string;
  travelTiming?: string;
  paxCount?: number;
  budget?: string;

  // Source & campaign attribution (Phase 1 stores the fields; Phase 5/6
  // are what actually populate campaign/adSet/ad automatically)
  source: CrmLeadSource;
  platform?: string;
  campaign?: string;
  campaignId?: string;
  adSet?: string;
  adSetId?: string;
  ad?: string;
  adId?: string;
  metaLeadId?: string; // dedupe key for Phase 5
  metaCreatedTime?: string; // Meta's own event timestamp, distinct from our createdAt

  // Sales pipeline
  status: CrmLeadStatus;
  lostReason?: string;
  assignedTo?: string; // Salesperson name — same lightweight string-tag pattern as Trip2Lead/PromoLead

  // Automatic timestamps (roadmap "AUTOMATIC DATA" + "LAST ACTIVITY VS
  // LAST CUSTOMER REPLY" — these two are intentionally independent)
  assignedAt?: string;
  lastActivityAt: string;
  lastCustomerReplyAt?: string;

  // Follow-up
  nextFollowUpAt?: string;
  followUpStatus?: "none" | "scheduled" | "overdue" | "done";

  // Booking linkage — set automatically by lib/crm/booking-link.ts
  // (Phase 7) as a lead moves through Booking Started -> Payment
  // Pending -> Booked.
  bookingId?: string;
  tripSlug?: string;
  pickupVariantName?: string;
  amountPaid?: number;
  remainingAmount?: number;

  notes?: string;

  createdAt: string;
  updatedAt: string;
}

const CrmLeadSchema = new Schema<CrmLeadDocument>(
  {
    leadId: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    whatsappNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    destination: { type: String, trim: true },
    travelTiming: { type: String, trim: true },
    paxCount: { type: Number },
    budget: { type: String, trim: true },

    source: { type: String, enum: CRM_LEAD_SOURCES, required: true, default: "manual" },
    platform: { type: String, trim: true },
    campaign: { type: String, trim: true },
    campaignId: { type: String, trim: true },
    adSet: { type: String, trim: true },
    adSetId: { type: String, trim: true },
    ad: { type: String, trim: true },
    adId: { type: String, trim: true },
    metaLeadId: { type: String, index: true, sparse: true },
    metaCreatedTime: { type: String },

    status: { type: String, enum: CRM_LEAD_STATUSES, required: true, default: "new", index: true },
    lostReason: { type: String },
    assignedTo: { type: String, index: true },

    assignedAt: { type: String },
    lastActivityAt: { type: String, required: true },
    lastCustomerReplyAt: { type: String, index: true },

    nextFollowUpAt: { type: String, index: true },
    followUpStatus: { type: String, enum: ["none", "scheduled", "overdue", "done"], default: "none" },

    bookingId: { type: String },
    tripSlug: { type: String },
    pickupVariantName: { type: String },
    amountPaid: { type: Number },
    remainingAmount: { type: Number },

    notes: { type: String },
  },
  { timestamps: true }
);

// Search: name / phone / whatsapp — the admin list's search box.
CrmLeadSchema.index({ name: "text" });

export const CrmLeadModel: Model<CrmLeadDocument> =
  models.CrmLead || model<CrmLeadDocument>("CrmLead", CrmLeadSchema);
