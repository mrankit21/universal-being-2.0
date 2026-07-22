/**
 * Single choke point for "log this user in and hand back the response."
 * Every login method — password (`/api/auth/login`), mobile OTP
 * (`/api/auth/otp/verify`), and the dev-only secret code
 * (`/api/auth/secret-code`) — calls this instead of duplicating cookie /
 * JWT logic. That's what guarantees they all produce the exact same
 * authenticated session and therefore access to the exact same protected
 * routes, rather than three slightly-different auth paths drifting apart
 * over time.
 */
import { ok } from "@/lib/api-helpers/respond";
import { issueSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import type { UserDocument } from "@/lib/db/models/user.model";

export async function issueLoginSession(user: UserDocument) {
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
}
