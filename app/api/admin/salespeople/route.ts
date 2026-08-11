/** GET/POST /api/admin/salespeople — the name list behind the "Assigned to"
 * selector on the admin Leads page. A flat, admin-managed list rather than
 * a full user account — salespeople here don't log into the admin panel,
 * they're just who a lead gets assigned to for WhatsApp/call follow-up. */
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SalespersonModel } from "@/lib/db/models/salesperson.model";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET() {
  try {
    await requirePermission("leads:read");
    await connectToDatabase();
    const people = await SalespersonModel.find().sort({ name: 1 }).lean();
    return ok(people);
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({ name: z.string().trim().min(1).max(80) });

export async function POST(req: NextRequest) {
  try {
    await requirePermission("leads:write");
    await connectToDatabase();
    const { name } = createSchema.parse(await req.json());

    const existing = await SalespersonModel.findOne({ name }).lean();
    if (existing) return fail("A salesperson with this name already exists.", 409);

    const person = await SalespersonModel.create({ name });
    return created(person);
  } catch (err) {
    return handleApiError(err);
  }
}
