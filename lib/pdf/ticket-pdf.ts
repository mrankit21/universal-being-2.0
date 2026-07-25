/**
 * E-Ticket PDF — premium HTML-rendered design (replaces the pdf-lib
 * drawText version). Every booking's ticket pulls that booking's OWN
 * trip's hero image via `booking.tripSlug` — nothing here is hardcoded to
 * any one destination; Udaipur was only ever the example while the design
 * was being approved.
 *
 * The Universal Being logo (`public/brand/logo.png`) is the one asset
 * that's always the same, on every ticket, regardless of trip.
 */
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db/mongoose";
import { TripModel } from "@/lib/db/models";
import { toEntity } from "@/lib/api/db-mappers";
import { tripRegistry } from "@/data/trips";
import { resolveImage } from "@/lib/image/resolve-image";
import type { Trip } from "@/types/trip";
import type { BookingDocument } from "@/lib/db/models/booking.model";
import QRCode from "qrcode";
import { buildTicketHtml } from "./ticket-html";
import { renderHtmlToPdf } from "./render-html-to-pdf";
import { localImageToDataUri, remoteImageToDataUri } from "./asset-utils";

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "PENDING",
  "slot-reserved": "SLOT RESERVED",
  "slot-paid": "SLOT-PAID",
  "remaining-payment-pending": "REMAINING DUE",
  "remaining-payment-received": "PAID IN FULL",
  confirmed: "CONFIRMED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
  refunded: "REFUNDED",
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; variant: "paid" | "pending" | "refunded" | "failed" }> = {
  "not-applicable": { label: "N/A", variant: "pending" },
  pending: { label: "PENDING", variant: "pending" },
  paid: { label: "PAID", variant: "paid" },
  refunded: { label: "REFUNDED", variant: "refunded" },
  failed: { label: "FAILED", variant: "failed" },
};

/** Looks up the trip regardless of its current published status — an
 * older booking must still be able to produce a ticket even if the trip
 * was later archived. Falls back to the static trip registry the same
 * way the rest of lib/api/trips.ts does when the DB is unavailable. */
async function getTripForTicket(tripSlug: string): Promise<Trip | null> {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const doc = await TripModel.findOne({ slug: tripSlug }).lean();
      if (doc) return toEntity(doc) as unknown as Trip;
    } catch (err) {
      console.error("[ticket-pdf] MongoDB unreachable, falling back to static trip registry:", err);
    }
  }
  return tripRegistry[tripSlug] ?? null;
}

function formatDepartureLabel(booking: BookingDocument): string {
  if (!booking.departureStartDate) return "—";
  const start = new Date(booking.departureStartDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (!booking.departureEndDate) return start;
  const end = new Date(booking.departureEndDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${start} – ${end}`;
}

export async function generateTicketPdf(booking: BookingDocument): Promise<Buffer> {
  const trip = await getTripForTicket(booking.tripSlug);

  // Logo: always the fixed Universal Being brand mark, never per-trip.
  const logoDataUri = await localImageToDataUri("brand/logo.png");

  // Hero photo: THIS booking's trip, not a hardcoded example. Falls back
  // to a navy gradient (handled in the template) if the trip has no
  // uploaded hero image yet, or the fetch fails.
  let destinationImageDataUri: string | null = null;
  if (trip?.heroImage) {
    const resolved = resolveImage(trip.heroImage, "hero");
    if (resolved.src) destinationImageDataUri = await remoteImageToDataUri(resolved.src);
  }

  const qrPayload = JSON.stringify({ bookingId: String(booking._id), tripSlug: booking.tripSlug });
  const qrDataUri = await QRCode.toDataURL(qrPayload, { margin: 1, width: 300 });

  const paymentInfo = PAYMENT_STATUS_LABELS[booking.paymentStatus] ?? { label: booking.paymentStatus.toUpperCase(), variant: "pending" as const };

  const html = buildTicketHtml({
    logoDataUri,
    destinationImageDataUri,
    destinationName: trip?.destinationName ?? booking.tripTitle,
    tripTagline: trip?.title ?? booking.tripTitle,
    heroCaption: trip?.shortDescription ?? "",
    bookingId: String(booking._id),
    departureLabel: formatDepartureLabel(booking),
    travellerName: booking.customerName,
    seats: booking.seatsBooked,
    emergencyContact: booking.emergencyContactName
      ? `${booking.emergencyContactName}${booking.emergencyContactPhone ? ` (${booking.emergencyContactPhone})` : ""}`
      : null,
    bookingStatusLabel: BOOKING_STATUS_LABELS[booking.status] ?? booking.status.toUpperCase(),
    paymentStatusLabel: paymentInfo.label,
    paymentStatusVariant: paymentInfo.variant,
    travellers: (booking.travelers ?? []).map((t) => ({ name: t.fullName, age: t.age })),
    qrDataUri,
  });

  return renderHtmlToPdf(html);
}
