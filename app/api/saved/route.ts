/**
 * GET  /api/saved  — the current customer's saved trip/destination keys
 *                     (lightweight — just `itemType:itemSlug` pairs, not
 *                     hydrated trip/destination data; the `/saved` page
 *                     itself hydrates via lib/api/trips.ts +
 *                     lib/api/destinations.ts). This is what SavedProvider
 *                     loads once on mount so every card's heart button
 *                     knows whether it's already saved with no per-card
 *                     fetch.
 * POST /api/saved  — save a trip or destination for the current customer.
 *                     Requires a customer session (`ub_customer_session`);
 *                     the header's login modal is what SaveButton opens
 *                     when this 401s.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SavedItemModel } from "@/lib/db/models";
import { getCurrentCustomer } from "@/lib/auth/current-customer";
import { savedItemCreateSchema } from "@/lib/validators/saved.schema";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";

export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return ok([]); // logged-out visitor — nothing saved, not an error

    await connectToDatabase();
    const items = await SavedItemModel.find({ customerId: customer.sub }).lean();
    return ok(items.map((item) => ({ itemType: item.itemType, itemSlug: item.itemSlug })));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return fail("Authentication required", 401);

    const body = savedItemCreateSchema.parse(await req.json());
    await connectToDatabase();

    try {
      const saved = await SavedItemModel.create({
        customerId: customer.sub,
        itemType: body.itemType,
        itemSlug: body.itemSlug,
      });
      return created({ itemType: saved.itemType, itemSlug: saved.itemSlug });
    } catch (err: unknown) {
      // Duplicate save (e.g. two taps, two tabs) — already saved, treat as success.
      if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
        return ok({ itemType: body.itemType, itemSlug: body.itemSlug });
      }
      throw err;
    }
  } catch (err) {
    return handleApiError(err);
  }
}
