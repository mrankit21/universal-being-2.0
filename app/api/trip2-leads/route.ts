/**
 * POST /api/trip2-leads — "Let's Plan Your Trip" callback form
 * (`LetsPlanYourTripV2`). No auth required — anonymous visitor lead
 * capture, same reasoning as `/api/promo-leads`. Best-effort by design:
 * the form already shows its "thanks, we'll call you" confirmation the
 * moment client-side validation passes, so a transient DB hiccup here
 * shouldn't be able to make someone think their request failed — it only
 * risks the lead not being logged for follow-up.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip2LeadModel } from "@/lib/db/models";
import { trip2LeadCreateSchema } from "@/lib/validators/trip2-lead.schema";
import { created, handleApiError } from "@/lib/api-helpers/respond";

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

    return created({ id: lead.id });
  } catch (err) {
    return handleApiError(err);
  }
}
