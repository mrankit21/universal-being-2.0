/**
 * GET /api/cron/send-reminders — Step 8C, Parts 9/10. Companion to
 * `/api/cron/expire-bookings`: meant to be hit once or twice a day by a
 * scheduler. Sends two kinds of reminder:
 *   - Remaining Payment Reminder: bookings with `remainingPaymentStatus:
 *     "pending"` whose trip departs within 7 days.
 *   - Trip Reminder: bookings departing within 2 days.
 * Same `CRON_SECRET` gate as the expiry sweep.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models/booking.model";
import { notifyRemainingPaymentReminder, notifyTripReminder } from "@/lib/notifications/dispatch";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.get("authorization");
  const query = req.nextUrl.searchParams.get("secret");
  return header === `Bearer ${secret}` || query === secret;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return fail("Unauthorized", 401);
    await connectToDatabase();

    const now = new Date();
    const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    const remainingDue = await BookingModel.find({
      remainingPaymentStatus: "pending",
      remainingAmount: { $gt: 0 },
      departureStartDate: { $gte: nowIso, $lte: in7Days },
    }).lean();

    for (const b of remainingDue) {
      await notifyRemainingPaymentReminder(b).catch(() => null);
    }

    const upcomingTrips = await BookingModel.find({
      status: { $in: ["slot-paid", "remaining-payment-received", "confirmed", "completed"] },
      departureStartDate: { $gte: nowIso, $lte: in2Days },
    }).lean();

    for (const b of upcomingTrips) {
      await notifyTripReminder(b).catch(() => null);
    }

    return ok({ remainingPaymentReminders: remainingDue.length, tripReminders: upcomingTrips.length });
  } catch (err) {
    return handleApiError(err);
  }
}
