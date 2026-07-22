/** DELETE /api/saved/[itemType]/[itemSlug] — unsave an item for the
 * current customer. Deliberately scoped to `customerId` in the query
 * filter (not just `_id`) so a customer can never unsave via a guessed
 * id belonging to someone else. */
import { connectToDatabase } from "@/lib/db/mongoose";
import { SavedItemModel } from "@/lib/db/models";
import { getCurrentCustomer } from "@/lib/auth/current-customer";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";

export async function DELETE(_req: Request, { params }: { params: Promise<{ itemType: string; itemSlug: string }> }) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return fail("Authentication required", 401);

    const { itemType, itemSlug } = await params;
    if (itemType !== "trip" && itemType !== "destination") return fail("Invalid item type", 422);

    await connectToDatabase();
    await SavedItemModel.deleteOne({ customerId: customer.sub, itemType, itemSlug });
    return ok({ itemType, itemSlug });
  } catch (err) {
    return handleApiError(err);
  }
}
