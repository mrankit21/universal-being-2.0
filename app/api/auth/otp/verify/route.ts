/** POST /api/auth/otp/verify — Step 2 of mobile OTP admin login. Validates
 * the code against the stored challenge and, on success, issues the exact
 * same session cookie as `/api/auth/login` via `issueLoginSession`. */
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models";
import { OtpChallengeModel } from "@/lib/db/models/otp-challenge.model";
import { issueLoginSession } from "@/lib/auth/issue-login-session";
import { otpVerifySchema } from "@/lib/validators/user.schema";
import { fail, handleApiError } from "@/lib/api-helpers/respond";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, code } = otpVerifySchema.parse(body);

    if (process.env.ENABLE_OTP_LOGIN === "false") {
      return fail("OTP login is disabled", 403);
    }

    await connectToDatabase();

    const challenge = await OtpChallengeModel.findOne({ mobile, consumedAt: null }).sort({ createdAt: -1 });
    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      return fail("Code expired or not requested. Request a new one.", 401);
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      return fail("Too many incorrect attempts. Request a new code.", 429);
    }

    const validCode = await bcrypt.compare(code, challenge.codeHash);
    if (!validCode) {
      challenge.attempts += 1;
      await challenge.save();
      return fail("Incorrect code", 401);
    }

    const user = await UserModel.findOne({ mobile, active: true });
    if (!user) {
      // Mobile passed the OTP challenge but the account was deactivated /
      // removed in between requesting and verifying — treat as a normal
      // auth failure rather than a 500.
      return fail("Account is no longer active", 401);
    }

    challenge.consumedAt = new Date();
    await challenge.save();

    return await issueLoginSession(user);
  } catch (err) {
    return handleApiError(err);
  }
}
