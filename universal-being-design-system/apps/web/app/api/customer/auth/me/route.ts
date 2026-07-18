import { getCurrentCustomer } from "@/lib/auth/current-customer";
import { ok, fail } from "@/lib/api-helpers/respond";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) return fail("Not authenticated", 401);
  return ok(customer);
}
