import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AnnouncementModel } from "@/lib/db/models";
import { announcementUpdateSchema } from "@/lib/validators/announcement.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("announcements:write");
    await connectToDatabase();
    const { id } = await params;
    const parsed = announcementUpdateSchema.parse(await req.json());
    // See destinations/[id]/route.ts — `.partial()` leaves untouched fields
    // as explicit `undefined` rather than omitting them, which Mongoose
    // would otherwise $set (i.e. unset) on the document.
    const update = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined));
    // Fetch as plain object, merge, write the whole document back — see
    // destinations/[id]/route.ts for why hydrate-then-save() wasn't
    // reliable enough here.
    const existing = await AnnouncementModel.findById(id).lean();
    if (!existing) return fail("Announcement not found", 404);
    const merged = { ...existing, ...update };
    delete (merged as Record<string, unknown>)._id;
    delete (merged as Record<string, unknown>).__v;
    delete (merged as Record<string, unknown>).createdAt;
    delete (merged as Record<string, unknown>).updatedAt;

    const announcement = await AnnouncementModel.findByIdAndUpdate(id, merged, {
      new: true,
      overwrite: true,
    });
    if (!announcement) return fail("Announcement not found", 404);
    revalidatePath("/", "layout");
    return ok(announcement);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("announcements:write");
    await connectToDatabase();
    const { id } = await params;
    const announcement = await AnnouncementModel.findByIdAndDelete(id);
    if (!announcement) return fail("Announcement not found", 404);
    revalidatePath("/", "layout");
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
