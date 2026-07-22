/** POST /api/auth/secret-code — development-only bypass so admin work
 * never has to stop for a password-login bug. Compares against
 * ADMIN_SECRET_CODE from `.env.local` and, on success, issues the exact
 * same session as the normal login for a real admin user record (never a
 * synthetic session), via `issueLoginSession`.
 *
 * Hard-disabled in production: this checks `NODE_ENV === "production"`
 * directly, not just an opt-in flag, so a forgotten/misconfigured env
 * variable can never accidentally enable it on a live deployment. */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models";
import { issueLoginSession } from "@/lib/auth/issue-login-session";
import { secretCodeLoginSchema } from "@/lib/validators/user.schema";
import { fail, handleApiError } from "@/lib/api-helpers/respond";

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production" || process.env.ENABLE_ADMIN_SECRET_LOGIN === "false") {
      return fail("Not available", 404);
    }

    const secret = process.env.ADMIN_SECRET_CODE;
    if (!secret) {
      return fail(
        "ADMIN_SECRET_CODE is not set in .env.local — secret-code login is unavailable until it is.",
        503
      );
    }

    const body = await req.json();
    const { code } = secretCodeLoginSchema.parse(body);

    if (code !== secret) {
      return fail("Incorrect code", 401);
    }

    await connectToDatabase();

    // Bind the session to a real admin record so RBAC, audit fields
    // (lastLoginAt), and every downstream permission check behave
    // identically to a normal login — never a synthetic/fake session.
    const boundEmail = process.env.ADMIN_SECRET_CODE_EMAIL?.toLowerCase();
    const user = boundEmail
      ? await UserModel.findOne({ email: boundEmail, active: true })
      : await UserModel.findOne({ role: "admin", active: true }).sort({ createdAt: 1 });

    if (!user) {
      return fail(
        "No active admin account exists to bind this session to. Run the dev admin seed first.",
        503
      );
    }

    return await issueLoginSession(user);
  } catch (err) {
    return handleApiError(err);
  }
}
