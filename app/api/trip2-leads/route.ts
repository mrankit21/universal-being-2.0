/**
 * POST /api/trip2-leads — "Let's Plan Your Trip" callback form
 * (`LetsPlanYourTripV2`). No auth required — anonymous visitor lead
 * capture, same reasoning as `/api/promo-leads`. Best-effort by design:
 * the form already shows its "thanks, we'll call you" confirmation the
 * moment client-side validation passes, so a transient DB hiccup here
 * shouldn't be able to make someone think their request failed — it only
 * risks the lead not being logged for follow-up.
 *
 * Phase 6 (CRM): also creates a `CrmLead` (dual-write, alongside the
 * existing `Trip2Lead` row — the pre-existing `/admin/leads` follow-up
 * queue keeps working unchanged) so this enquiry shows up in the full
 * sales pipeline. The CRM write is wrapped separately and never allowed
 * to fail the request — same best-effort principle as the primary write.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip2LeadModel } from "@/lib/db/models";
import { trip2LeadCreateSchema } from "@/lib/validators/trip2-lead.schema";
import { created, handleApiError } from "@/lib/api-helpers/respond";
import { ingestExternalLead } from "@/lib/crm/ingest";

export async function POST(req: NextRequest) {
  try {
    const body = trip2LeadCreateSchema.parse(await req.json());
    await connectToDatabase();

    const lead = await Trip2LeadModel.create({
      name: body.name,
      whatsappNumber: body.whatsappNumber,
      destination: body.destination,
      travelTiming: body.travelTiming,
      tripSlug: body.tripSlug,
      source: body.source ?? "trip2-lets-plan-your-trip",
    });

    try {
      await ingestExternalLead({
        name: body.name,
        phone: body.whatsappNumber,
        whatsappNumber: body.whatsappNumber,
        destination: body.destination,
        source: "website",
        platform: "Let's Plan Your Trip",
        travelTiming: body.travelTiming,
      });
    } catch (crmErr) {
      console.error("[trip2-leads] CRM dual-write failed (Trip2Lead was still saved):", crmErr);
    }

    return created({ id: lead.id });
  } catch (err) {
    return handleApiError(err);
  }
}
