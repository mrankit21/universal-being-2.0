import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DestinationModel, TripModel } from "@/lib/db/models";
import { destinationUpdateSchema } from "@/lib/validators/destination.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("destinations:read");
    await connectToDatabase();
    const { id } = await params;
    const destination = await DestinationModel.findById(id).lean();
    if (!destination) return fail("Destination not found", 404);
    return ok(destination);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("destinations:write");
    await connectToDatabase();
    const { id } = await params;
    const parsed = destinationUpdateSchema.parse(await req.json());

    if (parsed.slug) {
      const clash = await DestinationModel.findOne({ slug: parsed.slug, _id: { $ne: id } });
      if (clash) return fail(`A destination with slug "${parsed.slug}" already exists`, 409);
    }

    const destination = await DestinationModel.findByIdAndUpdate(id, parsed, {
      new: true,
      runValidators: true,
    });
    if (!destination) return fail("Destination not found", 404);
    return ok(destination);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("destinations:write");
    await connectToDatabase();
    const { id } = await params;

    const destination = await DestinationModel.findById(id);
    if (!destination) return fail("Destination not found", 404);

    const tripCount = await TripModel.countDocuments({ destinationSlug: destination.slug });
    if (tripCount > 0) {
      return fail(
        `Cannot delete "${destination.name}" — ${tripCount} trip(s) still reference it. Reassign or delete those trips first.`,
        409
      );
    }

    await destination.deleteOne();
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
