/** POST /api/auth/login — Architecture §11. Verifies credentials against the
 * `User` collection, issues a signed session JWT, and sets it as an
 * httpOnly cookie. This is the one place a plaintext password is ever seen
 * server-side, and it's never logged or persisted. */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models";
import { verifyPassword } from "@/lib/auth/password";
import { issueSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validators/user.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { loginRateLimit } from "@/lib/rate-limit/client";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import { isIpWhitelisted } from "@/lib/rate-limit/whitelist";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Brute-force protection: 5 attempts / 15 min, keyed by IP+email so a
    // single attacker can't just rotate emails from one IP (or hammer one
    // email from many IPs) to dodge the cap. Checked after schema
    // validation but before any DB work, so malformed requests don't
    // consume a real attempt's worth of budget.
    const ip = getClientIp(req);
    const limited = await enforceRateLimit(
      loginRateLimit,
      `${ip}:${email.toLowerCase()}`,
      "Too many login attempts. Please wait a few minutes and try again.",
      { bypass: isIpWhitelisted(ip) }
    );
    if (limited) return limited;

    await connectToDatabase();
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.active) return fail("Invalid email or password", 401);

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) return fail("Invalid email or password", 401);

    const token = await issueSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    user.lastLoginAt = new Date().toISOString();
    await user.save();

    const response = ok({ id: user.id, name: user.name, email: user.email, role: user.role });
    response.cookies.set(SESSION_COOKIE.name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE.maxAge,
    });
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
