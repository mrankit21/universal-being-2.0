/**
 * GET  /api/admin/testimonials  — list testimonials (Step 7.6B §4: Customer
 *                                  Image, chosen from the Media Library).
 * POST /api/admin/testimonials  — create a testimonial.
 *
 * Gated on the existing "homepage:*" permissions rather than a new RBAC
 * permission — testimonials are homepage content (the Homepage's
 * `testimonialIds` references this collection) and Step 7.6B's brief
 * explicitly leaves RBAC untouched.
 */
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TestimonialModel } from "@/lib/db/models";
import { testimonialSchema } from "@/lib/validators/testimonial.schema";
import { ok, created, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET() {
  try {
    await requirePermission("homepage:read");
    await connectToDatabase();
    const testimonials = await TestimonialModel.find().sort({ createdAt: -1 }).lean();
    return ok(testimonials);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("homepage:write");
    await connectToDatabase();
    const parsed = testimonialSchema.parse(await req.json());
    const testimonial = await TestimonialModel.create(parsed);
    revalidatePath("/", "layout");
    return created(testimonial);
  } catch (err) {
    return handleApiError(err);
  }
}
