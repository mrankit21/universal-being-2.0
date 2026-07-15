/** GET /api/admin/bookings — Booking Management dashboard list (requirement
 * #9), filterable by status. Bookings are created by the future public
 * booking flow (Architecture §6); admin never creates one directly, only
 * reads/updates status here. */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { expireIfDue } from "@/lib/trip/booking-expiry";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("bookings:read");
    await connectToDatabase();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    // sort: "createdAt:-1" (newest, default), "createdAt:1" (oldest),
    // "totalAmount:-1" (highest amount), "totalAmount:1" (lowest amount).
    const sortParam = searchParams.get("sort") ?? "createdAt:-1";
    const [sortField, sortDirRaw] = sortParam.split(":");
    const allowedSortFields = new Set(["createdAt", "totalAmount", "customerName"]);
    const sort: Record<string, 1 | -1> = {
      [allowedSortFields.has(sortField) ? sortField : "createdAt"]: sortDirRaw === "1" ? 1 : -1,
    };

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (q) {
      filter.$or = [
        { customerName: new RegExp(q, "i") },
        { customerEmail: new RegExp(q, "i") },
        { customerPhone: new RegExp(q, "i") },
        { tripTitle: new RegExp(q, "i") },
      ];
    }

    const [bookingsRaw, total] = await Promise.all([
      BookingModel.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      BookingModel.countDocuments(filter),
    ]);

    const bookings = await Promise.all(bookingsRaw.map((b) => expireIfDue(b)));

    return ok({ bookings, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}
