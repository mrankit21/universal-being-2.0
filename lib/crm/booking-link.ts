/**
 * Booking + Payment Integration — Phase 7.
 *
 * "When a lead books: Lead -> Booking -> Payment -> Booking Confirmed.
 * The CRM should automatically update: Status = BOOKED and link Booking
 * ID / Trip / Pickup Variant / Customer / Payment / Amount Paid /
 * Remaining Amount." Plus, per your call, the previously-deferred
 * "Booking Started" / "Payment Pending" sources are done here too, since
 * they're really the same hook points as the rest of this phase.
 *
 * Two call sites (both in the existing Booking API, both best-effort —
 * see the try/catch at each call site — a CRM hiccup must never affect
 * an actual booking or payment):
 *   1. `linkLeadOnBookingStarted()` — POST /api/bookings, right after the
 *      seat is reserved (`slot-reserved` / `paymentStatus: "pending"`).
 *      This is the roadmap's "Booking Started" / "Payment Pending" lead
 *      source — a customer who started but hasn't finished paying still
 *      shows up in the pipeline.
 *   2. `linkLeadOnPaymentReceived()` — called from both
 *      `/api/bookings/[id]/verify-payment` (client-verified) and
 *      `/api/payments/webhook` (server-side backup) right where each
 *      already calls `notifySlotPaid()` — the same "this booking is
 *      genuinely paid" signal, just reused for the CRM update instead of
 *      only the customer email.
 *
 * Does NOT touch Booking's own status machine (`slot-reserved` ->
 * `slot-paid` -> ...) — CrmLead.status is an entirely separate pipeline
 * on an entirely separate collection, exactly as the roadmap requires
 * ("Do NOT redesign or replace existing Booking Architecture").
 */
import type { BookingDocument } from "@/lib/db/models/booking.model";
import { CrmLeadModel } from "@/lib/db/models/crm-lead.model";
import { ingestExternalLead } from "@/lib/crm/ingest";
import { findLeadByPhone } from "@/lib/crm/reply";
import { logActivity } from "@/lib/crm/activity";
import { sendLeadConversionEvent } from "@/lib/meta/conversions-api";
import { CRM_PIPELINE_STATUSES, type CrmLeadStatus } from "@/lib/crm/constants";

/** Fire-and-forget Meta Conversions API call + activity log — shared by
 * both branches below so a genuinely-paid booking always reports back to
 * Meta exactly once, regardless of whether the lead already existed. */
function reportBookingConversion(lead: { leadId: string; phone?: string; email?: string; amountPaid?: number }) {
  sendLeadConversionEvent(lead)
    .then((result) => {
      if (result.ok) {
        return logActivity({
          leadId: lead.leadId,
          type: "meta_conversion_sent",
          message: "Sent booking conversion to Meta Conversions API",
          actor: "System",
        });
      }
    })
    .catch((err) => console.error("[meta-capi] activity logging failed:", err));
}

/** Rank of a status in the forward pipeline — used so a booking/payment
 * event can only ever move a lead *forward*, never regress one that's
 * already further along (e.g. a lead someone already marked
 * `trip_completed` shouldn't be knocked back to `booked` by a late
 * webhook retry). `lost` sorts last (rank -1 -> treated as "always
 * overwritable" is wrong for a closed lead, so it's excluded — closed
 * leads are simply left alone by this file entirely). */
function pipelineRank(status: CrmLeadStatus): number {
  const idx = (CRM_PIPELINE_STATUSES as readonly string[]).indexOf(status);
  return idx === -1 ? Infinity : idx; // "lost" (not in CRM_PIPELINE_STATUSES) never gets overwritten
}

export async function linkLeadOnBookingStarted(booking: BookingDocument): Promise<void> {
  const existing = await findLeadByPhone(booking.customerPhone);

  if (existing) {
    if (existing.status === "lost" || pipelineRank(existing.status) >= pipelineRank("payment_pending")) {
      // Already further along (or further along than "payment_pending"
      // would be) — just attach the booking reference, don't touch status.
      await CrmLeadModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            bookingId: String(booking._id),
            tripSlug: booking.tripSlug,
            pickupVariantName: booking.pickupVariantName,
            lastActivityAt: new Date().toISOString(),
          },
        }
      );
    } else {
      await CrmLeadModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            status: "payment_pending",
            bookingId: String(booking._id),
            tripSlug: booking.tripSlug,
            pickupVariantName: booking.pickupVariantName,
            amountPaid: booking.amountPaid,
            remainingAmount: booking.remainingAmount,
            lastActivityAt: new Date().toISOString(),
          },
        }
      );
    }
    await logActivity({
      leadId: existing.leadId,
      type: "booking_linked",
      message: `Booking started for ${booking.tripTitle} (${booking.tripSlug})`,
      actor: "System",
    });
    return;
  }

  // No existing lead for this phone number at all — a booking with no
  // prior CRM trace (e.g. customer skipped every form and booked
  // directly). Create one, same as the roadmap's "Booking Started" /
  // "Payment Pending" source.
  await ingestExternalLead({
    name: booking.customerName,
    phone: booking.customerPhone,
    email: booking.customerEmail,
    destination: booking.tripTitle,
    source: "website",
    platform: "Booking Started",
    status: "payment_pending",
    bookingId: String(booking._id),
    tripSlug: booking.tripSlug,
    pickupVariantName: booking.pickupVariantName,
    amountPaid: booking.amountPaid,
    remainingAmount: booking.remainingAmount,
  });
}

export async function linkLeadOnPaymentReceived(booking: BookingDocument): Promise<void> {
  // Booking ID is the most reliable match once `linkLeadOnBookingStarted`
  // has run (the common case) — falls back to phone in case that earlier
  // step didn't find/create anything for some reason (e.g. it ran before
  // this feature existed, or its best-effort write failed).
  const byBooking = await CrmLeadModel.findOne({ bookingId: String(booking._id) });
  const lead = byBooking ?? (await findLeadByPhone(booking.customerPhone));

  if (!lead) {
    const created = await ingestExternalLead({
      name: booking.customerName,
      phone: booking.customerPhone,
      email: booking.customerEmail,
      destination: booking.tripTitle,
      source: "website",
      platform: "Booking Started",
      status: "booked",
      bookingId: String(booking._id),
      tripSlug: booking.tripSlug,
      pickupVariantName: booking.pickupVariantName,
      amountPaid: booking.amountPaid,
      remainingAmount: booking.remainingAmount,
    });
    reportBookingConversion({
      leadId: created.leadId,
      phone: booking.customerPhone,
      email: booking.customerEmail,
      amountPaid: booking.amountPaid,
    });
    return;
  }

  if (lead.status !== "lost" && pipelineRank(lead.status) < pipelineRank("booked")) {
    await CrmLeadModel.updateOne(
      { _id: lead._id },
      {
        $set: {
          status: "booked",
          bookingId: String(booking._id),
          tripSlug: booking.tripSlug,
          pickupVariantName: booking.pickupVariantName,
          amountPaid: booking.amountPaid,
          remainingAmount: booking.remainingAmount,
          lastActivityAt: new Date().toISOString(),
        },
      }
    );
    reportBookingConversion({
      leadId: lead.leadId,
      phone: booking.customerPhone,
      email: booking.customerEmail,
      amountPaid: booking.amountPaid,
    });
  } else {
    // Already booked (or further along) — payment amount can still
    // change (e.g. remaining balance settling later), so keep that in
    // sync without touching status. Meta conversion was already sent
    // the first time this lead crossed into "booked", so it isn't
    // re-sent here.
    await CrmLeadModel.updateOne(
      { _id: lead._id },
      { $set: { amountPaid: booking.amountPaid, remainingAmount: booking.remainingAmount } }
    );
  }

  await logActivity({
    leadId: lead.leadId,
    type: "payment_received",
    message: `Payment received — ₹${booking.amountPaid.toLocaleString("en-IN")} for ${booking.tripTitle}`,
    actor: "System",
  });
}
