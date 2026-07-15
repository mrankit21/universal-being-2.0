import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DestinationModel } from "@/lib/db/models";
import { destinationSchema } from "@/lib/validators/destination.schema";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("destinations:read");
    await connectToDatabase();
    const status = req.nextUrl.searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const destinations = await DestinationModel.find(filter).sort({ name: 1 }).lean();
    return ok(destinations);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("destinations:write");
    await connectToDatabase();
    const parsed = destinationSchema.parse(await req.json());

    const existing = await DestinationModel.findOne({ slug: parsed.slug });
    if (existing) return fail(`A destination with slug "${parsed.slug}" already exists`, 409);

    const destination = await DestinationModel.create(parsed);
    return created(destination);
  } catch (err) {
    return handleApiError(err);
  }
}
