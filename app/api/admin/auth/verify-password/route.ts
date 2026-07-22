/**
 * POST /api/admin/auth/verify-password — re-authentication check for
 * destructive Admin Panel actions. `components/admin/confirm-dialog.tsx`
 * (used by every "Delete" button across Trips, Destinations, Users, Media,
 * Testimonials, Announcements) calls this before it lets `onConfirm` run,
 * so a stray tap on the trash icon can no longer delete anything by
 * itself — the admin's own current password has to be typed in first.
 *
 * Deliberately NOT a login: it doesn't touch the session cookie at all,
 * it only checks the already-logged-in admin's password against their own
 * `passwordHash` (same `verifyPassword()` helper `/api/auth/login` uses).
 * Rate-limited per-user (not per-IP) so repeated wrong guesses on one
 * account get capped even from a trusted IP.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models";
import { verifyPassword } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { adminReauthRateLimit } from "@/lib/rate-limit/client";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";

const bodySchema = z.object({ password: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Authentication required", 401);

    const limited = await enforceRateLimit(
      adminReauthRateLimit,
      user.sub,
      "Too many attempts. Please wait a few minutes and try again."
    );
    if (limited) return limited;

    const { password } = bodySchema.parse(await req.json());

    await connectToDatabase();
    const dbUser = await UserModel.findById(user.sub);
    if (!dbUser || !dbUser.active) return fail("Password is incorrect", 401);

    const validPassword = await verifyPassword(password, dbUser.passwordHash);
    if (!validPassword) return fail("Password is incorrect", 401);

    return ok({ verified: true });
  } catch (err) {
    return handleApiError(err);
  }
}
