/** GET /api/auth/methods — public, unauthenticated. Tells the login UI
 * which alternate login methods are currently enabled so it can hide/show
 * tabs without ever exposing ADMIN_SECRET_CODE or provider credentials
 * themselves. Safe to call before authentication (that's the point). */
import { ok } from "@/lib/api-helpers/respond";

export async function GET() {
  const isProd = process.env.NODE_ENV === "production";

  return ok({
    otp: process.env.ENABLE_OTP_LOGIN !== "false",
    secretCode: !isProd && process.env.ENABLE_ADMIN_SECRET_LOGIN !== "false" && Boolean(process.env.ADMIN_SECRET_CODE),
    google: process.env.GOOGLE_CLIENT_ID ? true : false,
  });
}
