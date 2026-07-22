import { getCurrentUser } from "@/lib/auth/current-user";
import { ok, fail } from "@/lib/api-helpers/respond";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not authenticated", 401);
  return ok(user);
}
