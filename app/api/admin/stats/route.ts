/** GET /api/admin/stats — powers the Dashboard module's stat cards
 * (requirement #1). Revenue is a placeholder (`revenueCollected: 0` shape
 * kept ready) until the Payment Gateway phase lands. */
import { connectToDatabase } from "@/lib/db/mongoose";
import { TripModel, BookingModel, DestinationModel } from "@/lib/db/models";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET() {
  try {
    await requirePermission("dashboard:view");
    await connectToDatabase();

    const now = new Date().toISOString().slice(0, 10);

    const [
      totalTrips,
      publishedTrips,
      draftTrips,
      featuredTrips,
      totalDestinations,
      activeBookings,
      pendingBookings,
      totalBookings,
      upcomingBatchesTrips,
    ] = await Promise.all([
      TripModel.countDocuments(),
      TripModel.countDocuments({ status: "published" }),
      TripModel.countDocuments({ status: "draft" }),
      TripModel.countDocuments({ featured: true }),
      DestinationModel.countDocuments(),
      BookingModel.countDocuments({ status: { $in: ["pending", "confirmed"] } }),
      BookingModel.countDocuments({ status: "pending" }),
      BookingModel.countDocuments(),
      TripModel.find({ "departureDates.startDate": { $gte: now } })
        .select("title slug departureDates")
        .lean(),
    ]);

    const upcomingBatches = upcomingBatchesTrips
      .flatMap((trip) =>
        (trip.departureDates as { id: string; startDate: string; seatsAvailable: number }[])
          .filter((d) => d.startDate >= now)
          .map((d) => ({
            tripTitle: trip.title,
            tripSlug: trip.slug,
            departureId: d.id,
            startDate: d.startDate,
            seatsAvailable: d.seatsAvailable,
          }))
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 10);

    return ok({
      totalTrips,
      publishedTrips,
      draftTrips,
      featuredTrips,
      totalDestinations,
      activeBookings,
      pendingBookings,
      totalBookings,
      upcomingBatches,
      // Revenue is a placeholder surface until the Payment Gateway phase.
      revenue: { collected: 0, pending: 0, currency: "INR", enabled: false },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
