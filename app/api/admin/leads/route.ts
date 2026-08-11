/**
 * GET /api/admin/leads — unified read-only view over the two anonymous
 * lead-capture collections that had no admin UI before this route existed:
 * `Trip2Lead` ("Let's Plan Your Trip" callback card on Trip 2.0 pages) and
 * `PromoLead` (the site-wide coupon popup). Both are marketing captures,
 * not customer accounts (see the comments on each model), so they're kept
 * as separate Mongoose collections but surfaced together here as one
 * `kind`-tagged list so admins have a single follow-up queue instead of
 * checking the database directly.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip2LeadModel } from "@/lib/db/models/trip2-lead.model";
import { PromoLeadModel } from "@/lib/db/models/promo-lead.model";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export interface AdminLeadRow {
  id: string;
  kind: "trip2" | "promo";
  name: string;
  whatsappNumber: string;
  detail: string; // destination+timing for trip2, coupon code for promo
  tripSlug?: string;
  source?: string;
  contacted: boolean;
  assignedTo?: string;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  try {
    await requirePermission("leads:read");
    await connectToDatabase();

    const contactedParam = req.nextUrl.searchParams.get("contacted");
    const filter =
      contactedParam === null ? {} : { contacted: contactedParam === "true" };

    const [trip2Leads, promoLeads] = await Promise.all([
      Trip2LeadModel.find(filter).sort({ createdAt: -1 }).lean(),
      PromoLeadModel.find(filter).sort({ createdAt: -1 }).lean(),
    ]);

    const rows: AdminLeadRow[] = [
      ...trip2Leads.map((l) => ({
        id: String(l._id),
        kind: "trip2" as const,
        name: l.name,
        whatsappNumber: l.whatsappNumber,
        detail: [l.destination, l.travelTiming].filter(Boolean).join(" · "),
        tripSlug: l.tripSlug,
        source: l.source,
        contacted: l.contacted,
        assignedTo: l.assignedTo,
        createdAt: l.createdAt,
      })),
      ...promoLeads.map((l) => ({
        id: String(l._id),
        kind: "promo" as const,
        name: l.fullName,
        whatsappNumber: l.whatsappNumber,
        detail: `Coupon: ${l.couponCode}`,
        source: l.source,
        contacted: l.contacted,
        assignedTo: l.assignedTo,
        createdAt: l.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}
