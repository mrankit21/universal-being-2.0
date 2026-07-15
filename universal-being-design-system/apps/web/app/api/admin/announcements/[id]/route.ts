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
    const announcement = await AnnouncementModel.findByIdAndUpdate(id, parsed, {
      new: true,
      runValidators: true,
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
