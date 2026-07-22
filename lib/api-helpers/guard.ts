/** Route-handler-side auth + permission guard. `middleware.ts` already blocks
 * unauthenticated requests to `/api/admin/**` at the edge, but every route
 * re-checks here too (defense in depth) and additionally enforces the
 * fine-grained RBAC permission for that specific action. */
import { getCurrentUser } from "@/lib/auth/current-user";
import { can, type Permission } from "@/lib/auth/rbac";
import type { SessionClaims } from "@/lib/auth/session";

export async function requirePermission(permission: Permission): Promise<SessionClaims> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!can(user.role, permission)) throw new Error("FORBIDDEN");
  return user;
}
