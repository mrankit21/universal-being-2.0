/**
 * POST /api/promo-leads — the site-wide promotional popup's lead capture.
 * No auth required (a promo popup is shown to anonymous visitors); it's a
 * marketing capture, not a customer account, so it writes to `PromoLead`
 * rather than `Customer`. Best-effort by design — the popup already reveals
 * the coupon code the moment the form passes client-side validation, so a
 * transient DB hiccup here shouldn't be able to block someone from getting
 * their discount, only from being logged as a lead.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PromoLeadModel } from "@/lib/db/models";
import { promoLeadCreateSchema } from "@/lib/validators/promo-lead.schema";
import { created, handleApiError } from "@/lib/api-helpers/respond";

export async function POST(req: NextRequest) {
  try {
    const body = promoLeadCreateSchema.parse(await req.json());
    await connectToDatabase();

    const lead = await PromoLeadModel.create({
      fullName: body.fullName,
      whatsappNumber: body.whatsappNumber,
      couponCode: body.couponCode,
      source: body.source ?? "promo-popup",
    });

    return created({ id: lead.id });
  } catch (err) {
    return handleApiError(err);
  }
}
