/**
 * GET /api/cron/expire-bookings — Feature 3, proactive half of the Booking
 * Expiry Timer. Meant to be hit on a schedule (Vercel Cron, any external
 * scheduler, or a simple `curl` in a crontab) — e.g. every minute — so
 * seats are released the moment a reservation's window passes rather than
 * only the next time someone happens to read that booking.
 *
 * No admin action is ever required: this is the fully-automatic path the
 * spec calls for. Protected by `CRON_SECRET` so it can't be triggered by
 * anyone who finds the URL.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { expireDueReservations } from "@/lib/trip/booking-expiry";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      // Fail closed in prod — an unset secret must never mean "open to anyone".
      throw new Error(
        "CRON_SECRET is not set. Set CRON_SECRET in your production environment " +
          "to enable the booking-expiry cron endpoint. See .env.example."
      );
    }
    return true; // no secret configured — allow (dev convenience); set CRON_SECRET in prod
  }
  const header = req.headers.get("authorization");
  const query = req.nextUrl.searchParams.get("secret");
  return header === `Bearer ${secret}` || query === secret;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return fail("Unauthorized", 401);
    await connectToDatabase();
    const result = await expireDueReservations();
    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export const POST = GET;
