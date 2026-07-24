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
    const body = await req.json();
    const parsed = testimonialUpdateSchema.parse(body);
    // Only forward keys the client actually sent in the RAW body. Filtering
    // on `v !== undefined` is not enough: fields with a `.default()` (e.g.
    // published/enabled flags) get that default silently applied by zod
    // even when the client never sent the key, so they come back *defined*
    // and slip through a definedness filter — overwriting the real value.
    // Checking the pre-zod `body` for the key is the only reliable way to
    // tell "client sent this" from "zod defaulted this".
    const update = Object.fromEntries(
      Object.entries(parsed).filter(([k]) => Object.prototype.hasOwnProperty.call(body, k))
    );
    // Fetch as plain object, merge, write the whole document back — see
    // destinations/[id]/route.ts for why hydrate-then-save() wasn't
    // reliable enough here.
    const existing = await TestimonialModel.findById(id).lean();
    if (!existing) return fail("Testimonial not found", 404);
    const merged = { ...existing, ...update };
    delete (merged as Record<string, unknown>)._id;
    delete (merged as Record<string, unknown>).__v;
    delete (merged as Record<string, unknown>).createdAt;
    delete (merged as Record<string, unknown>).updatedAt;

    const testimonial = await TestimonialModel.findByIdAndUpdate(id, merged, {
      new: true,
      overwrite: true,
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
