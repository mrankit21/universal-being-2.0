/**
 * CRM constants — Phase 1 (CRM Foundation) of the Lead Management System
 * roadmap. Single source of truth for the pipeline, sources, platforms,
 * and lost reasons so the model, the Zod validator, and the admin UI
 * never drift out of sync with each other (same pattern as
 * `lib/config/booking-config.ts` for BookingStatus).
 */

/** Primary lead pipeline (roadmap "LEAD LIFECYCLE"). Order matters — the
 * admin UI renders these left-to-right as the pipeline. `lost` is the
 * alternate terminal state, reached from any stage via "Close Lead". */
export const CRM_LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "itinerary_sent",
  "quotation_sent",
  "payment_pending",
  "booked",
  "trip_completed",
  "lost",
] as const;
export type CrmLeadStatus = (typeof CRM_LEAD_STATUSES)[number];

/** The forward pipeline only — `CRM_LEAD_STATUSES` minus the `lost` side
 * exit. This is what Phase 2's one-click action bar renders as buttons
 * (`lost` gets its own dedicated "Close Lead" control instead, since it
 * needs a reason attached). */
export const CRM_PIPELINE_STATUSES = CRM_LEAD_STATUSES.filter((s) => s !== "lost") as Exclude<
  CrmLeadStatus,
  "lost"
>[];

export const CRM_LEAD_STATUS_LABELS: Record<CrmLeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  itinerary_sent: "Itinerary Sent",
  quotation_sent: "Quotation Sent",
  payment_pending: "Payment Pending",
  booked: "Booked",
  trip_completed: "Trip Completed",
  lost: "Lost / Closed",
};

export const CRM_LOST_REASONS = [
  "Not Interested",
  "Budget Issue",
  "Travel Cancelled",
  "Wrong Enquiry",
  "Date Changed",
  "Other",
] as const;
export type CrmLostReason = (typeof CRM_LOST_REASONS)[number];

/** Where the lead came from. Phase 1 only ever writes "website" or
 * "manual" (forms + admin-created leads); "meta", "instagram",
 * "facebook", "whatsapp" are reserved here so Phase 5/6 don't need a
 * schema migration — they just start writing values that already exist
 * in this union. */
export const CRM_LEAD_SOURCES = [
  "website",
  "manual",
  "meta",
  "instagram",
  "facebook",
  "whatsapp",
] as const;
export type CrmLeadSource = (typeof CRM_LEAD_SOURCES)[number];

export const CRM_LEAD_SOURCE_LABELS: Record<CrmLeadSource, string> = {
  website: "Website",
  manual: "Manual",
  meta: "Meta Lead Ads",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
};

/** A lead counts as "No Response > 2 Days" once this many hours have
 * passed since `lastCustomerReplyAt` with no newer reply — see
 * `lib/crm/activity.ts` -> `isNoResponse()`. */
export const CRM_NO_RESPONSE_HOURS = 48;
