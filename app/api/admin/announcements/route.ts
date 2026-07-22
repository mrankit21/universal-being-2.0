import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AnnouncementModel } from "@/lib/db/models";
import { announcementSchema } from "@/lib/validators/announcement.schema";
import { ok, created, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET() {
  try {
    await requirePermission("announcements:read");
    await connectToDatabase();
    const announcements = await AnnouncementModel.find().sort({ createdAt: -1 }).lean();
    return ok(announcements);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("announcements:write");
    await connectToDatabase();
    const parsed = announcementSchema.parse(await req.json());
    const announcement = await AnnouncementModel.create(parsed);
    return created(announcement);
  } catch (err) {
    return handleApiError(err);
  }
}
