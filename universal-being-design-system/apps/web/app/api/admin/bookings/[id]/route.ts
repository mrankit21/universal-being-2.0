import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel, TripModel } from "@/lib/db/models";
import { bookingUpdateSchema } from "@/lib/validators/booking.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { expireIfDue } from "@/lib/trip/booking-expiry";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("bookings:read");
    await connectToDatabase();
    const { id } = await params;
    const booking = await BookingModel.findById(id).lean();
    if (!booking) return fail("Booking not found", 404);
    const fresh = await expireIfDue(booking);
    return ok(fresh);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requirePermission("bookings:write");
    await connectToDatabase();
    const { id } = await params;
    const parsed = bookingUpdateSchema.parse(await req.json());

    const booking = await BookingModel.findById(id);
    if (!booking) return fail("Booking not found", 404);

    // Cancelling or manually expiring a booking that still holds seats
    // releases them back to the batch, and re-opens it if it had flipped
    // to sold-out. (Automatic expiry already does this via
    // `releaseExpiredBooking` — this covers the admin manually setting the
    // status instead of waiting for the timer/cron.)
    const releasesSeats = ["cancelled", "expired"];
    if (parsed.status && releasesSeats.includes(parsed.status) && !releasesSeats.includes(booking.status)) {
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
    }

    // Booking Status Timeline (Part 8) — every status transition is
    // appended, never overwritten, so the admin can see the full history
    // (created → confirmed → ... ) with timestamps and notes.
    if (parsed.status && parsed.status !== booking.status) {
      booking.statusHistory = [
        ...(booking.statusHistory ?? []),
        {
          status: parsed.status,
          note: parsed.statusNote,
          changedAt: new Date().toISOString(),
          changedBy: user.email,
        },
      ];
    }

    const { statusNote: _statusNote, ...fields } = parsed;
    void _statusNote;
    Object.assign(booking, fields);
    await booking.save();

    return ok(booking);
  } catch (err) {
    return handleApiError(err);
  }
}
