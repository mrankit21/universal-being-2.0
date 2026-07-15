/**
 * Booking Expiry Timer (Feature 3). Single source of truth for "is this
 * reservation past its window" and "what happens when it is" so every
 * caller — lazy-expiry-on-read in the API routes, and the proactive cron
 * sweep — shares the exact same rule and the exact same release logic.
 *
 * Two complementary trigger paths, both automatic (no admin action):
 *   1. Lazy: any time a slot-reserved booking is read (customer lookup,
 *      admin detail/list), we check + expire it first if its window has
 *      passed, so stale data is never served.
 *   2. Proactive: `app/api/cron/expire-bookings/route.ts` is meant to be
 *      hit on a schedule (e.g. every minute via Vercel Cron / any external
 *      scheduler) so seats are released even if nobody happens to load
 *      that booking — this is what actually frees the seat for the next
 *      customer in real time rather than only "on next view".
 */
import { BookingModel, TripModel } from "@/lib/db/models";
import type { BookingDocument, BookingStatus } from "@/lib/db/models/booking.model";

/** Statuses that still hold a seat and are subject to expiry. Once a
 * booking leaves this set (paid, cancelled, expired, completed, ...) its
 * reservation window is irrelevant. */
const EXPIRABLE_STATUSES = new Set<BookingStatus>(["pending", "slot-reserved"]);

export function isReservationExpired(booking: Pick<BookingDocument, "status" | "reservationExpiresAt">, now: Date = new Date()): boolean {
  if (!EXPIRABLE_STATUSES.has(booking.status)) return false;
  if (!booking.reservationExpiresAt) return false;
  return new Date(booking.reservationExpiresAt).getTime() <= now.getTime();
}

/**
 * Expires a single booking: releases its seats back to the trip's
 * departure batch, flips the batch off "sold-out" if that's what caused
 * it, and marks the booking `expired` with a status-history entry. Safe to
 * call more than once — no-ops if the booking is no longer in an
 * expirable state (idempotent, so a race between the lazy check and the
 * cron sweep can't double-release seats).
 */
export async function releaseExpiredBooking(bookingId: string): Promise<boolean> {
  const booking = await BookingModel.findOneAndUpdate(
    { _id: bookingId, status: { $in: Array.from(EXPIRABLE_STATUSES) } },
    {
      $set: {
        status: "expired",
        paymentStatus: "failed",
      },
      $push: {
        statusHistory: {
          status: "expired",
          note: "Reservation expired — payment not completed within the booking window. Seat released automatically.",
          changedAt: new Date().toISOString(),
        },
      },
    },
    { new: false } // we want the pre-update doc to know how many seats to give back
  );

  if (!booking) return false; // already expired/paid/cancelled by someone else — nothing to do

  await TripModel.updateOne(
    { _id: booking.tripId, "departureDates.id": booking.departureDateId },
    {
      $inc: {
        "departureDates.$.seatsAvailable": booking.seatsBooked,
        availableSeats: booking.seatsBooked,
      },
    }
  );
  await TripModel.updateOne(
    { _id: booking.tripId, "departureDates.id": booking.departureDateId, "departureDates.status": "sold-out" },
    { $set: { "departureDates.$.status": "open" } }
  );

  return true;
}

/** Lazy-expiry: call before returning any booking read from the API. If
 * it's past its window, expires it in the DB and returns the now-current
 * (expired) document; otherwise returns the input untouched. */
export async function expireIfDue<T extends { _id: unknown; status: BookingStatus; reservationExpiresAt?: string }>(
  booking: T
): Promise<T> {
  if (!isReservationExpired(booking)) return booking;
  const released = await releaseExpiredBooking(String(booking._id));
  if (!released) return booking;
  const fresh = await BookingModel.findById(booking._id).lean();
  return (fresh as unknown as T) ?? { ...booking, status: "expired" };
}

/** Proactive sweep for the cron endpoint: finds every reservation whose
 * window has already passed and releases each one. Returns how many were
 * expired so the cron caller can log/alert on it. */
export async function expireDueReservations(now: Date = new Date()): Promise<{ expiredCount: number; ids: string[] }> {
  const due = await BookingModel.find({
    status: { $in: Array.from(EXPIRABLE_STATUSES) },
    reservationExpiresAt: { $ne: null, $lte: now.toISOString() },
  })
    .select("_id")
    .lean();

  const ids: string[] = [];
  for (const b of due) {
    const released = await releaseExpiredBooking(String(b._id));
    if (released) ids.push(String(b._id));
  }
  return { expiredCount: ids.length, ids };
}
