/**
 * GET /api/admin/me — the logged-in admin's own identity (name, email,
 * role). Introduced for Phase 4 ("Sales Team + Assignment") so CRM client
 * components can show "My Leads" and hide manager-only controls without
 * every page needing to be a Server Component. Read-only, no permission
 * check beyond "is logged in" — every admin is allowed to know who they are.
 */
import { getCurrentUser } from "@/lib/auth/current-user";
import { ok, fail } from "@/lib/api-helpers/respond";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not authenticated", 401);
  return ok({ name: user.name, email: user.email, role: user.role });
}
