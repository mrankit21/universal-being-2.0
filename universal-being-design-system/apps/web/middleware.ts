/**
 * Edge middleware — the route-gating layer Architecture §7 describes:
 * "Gated route group `app/admin`, protected by middleware checking a role
 * claim (JWT from Express auth)". Runs on the Edge runtime, so session
 * verification uses `lib/auth/session.ts`'s `jose`-based JWT check (Web
 * Crypto, not Node's `crypto`) rather than `jsonwebtoken`.
 *
 * This only checks "is there a valid session" — fine-grained per-permission
 * checks (RBAC) happen in the page/route itself via `lib/api-helpers/guard.ts`
 * and `lib/auth/rbac.ts`, since those need to know which specific action is
 * being attempted.
 */
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE.name)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (isAdminApi) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Forward the verified claims to the request so Server Components / route
  // handlers can read them cheaply without re-verifying (defense-in-depth
  // re-check still happens server-side via `getCurrentUser()`).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-ub-user-id", session.sub);
  requestHeaders.set("x-ub-user-role", session.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
