/** POST /api/auth/otp/request — Step 1 of mobile OTP admin login. Verifies
 * the mobile number belongs to an active admin user, mints a short-lived
 * OTP challenge, and hands it to the configured SMS provider
 * (`lib/auth/sms-provider.ts`). Never reveals whether a mobile number is
 * registered — same generic response either way — so this can't be used to
 * enumerate admin accounts. */
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models";
import { OtpChallengeModel } from "@/lib/db/models/otp-challenge.model";
import { getSmsProvider, generateOtpCode } from "@/lib/auth/sms-provider";
import { otpRequestSchema } from "@/lib/validators/user.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { otpRequestRateLimit } from "@/lib/rate-limit/client";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import { isIpWhitelisted, isMobileWhitelisted } from "@/lib/rate-limit/whitelist";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile } = otpRequestSchema.parse(body);

    if (process.env.ENABLE_OTP_LOGIN === "false") {
      return fail("OTP login is disabled", 403);
    }

    // 3 sends / 10 min per mobile number — each send is a paid SMS, and
    // without this cap the endpoint allows unlimited sends to any number
    // (including numbers that aren't even registered, since the response
    // is intentionally identical either way — see module doc above).
    // Bypassed if either the caller's IP or the mobile itself is
    // whitelisted, since this limiter (unlike the others) is keyed by
    // mobile, not IP — an admin testing OTP repeatedly needs their own
    // test number whitelisted, not just their IP.
    const limited = await enforceRateLimit(
      otpRequestRateLimit,
      mobile,
      "Too many OTP requests for this number. Please wait a few minutes and try again.",
      { bypass: isIpWhitelisted(getClientIp(req)) || isMobileWhitelisted(mobile) }
    );
    if (limited) return limited;

    await connectToDatabase();
    const user = await UserModel.findOne({ mobile, active: true });

    // Always invalidate any prior challenge for this number and mint a new
    // one, but only actually send an SMS if a matching user exists. The
    // HTTP response is identical either way.
    if (user) {
      const code = generateOtpCode();
      const codeHash = await bcrypt.hash(code, 10);

      await OtpChallengeModel.deleteMany({ mobile, consumedAt: null });
      await OtpChallengeModel.create({
        mobile,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
      });

      await getSmsProvider().sendOtp(mobile, code);
    }

    return ok({
      sent: true,
      devHint:
        process.env.NODE_ENV !== "production"
          ? "Development mode: use code 123456."
          : undefined,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
