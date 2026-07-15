import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TestimonialModel } from "@/lib/db/models";
import { testimonialUpdateSchema } from "@/lib/validators/testimonial.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("homepage:write");
    await connectToDatabase();
    const { id } = await params;
    const parsed = testimonialUpdateSchema.parse(await req.json());
    const testimonial = await TestimonialModel.findByIdAndUpdate(id, parsed, {
      new: true,
      runValidators: true,
    });
    if (!testimonial) return fail("Testimonial not found", 404);
    revalidatePath("/", "layout");
    return ok(testimonial);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("homepage:write");
    await connectToDatabase();
    const { id } = await params;
    const testimonial = await TestimonialModel.findByIdAndDelete(id);
    if (!testimonial) return fail("Testimonial not found", 404);
    revalidatePath("/", "layout");
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
