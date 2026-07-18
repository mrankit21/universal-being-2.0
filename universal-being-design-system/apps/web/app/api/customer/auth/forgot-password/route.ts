/** POST /api/customer/auth/forgot-password — mints a short-lived reset
 * token, stores only its bcrypt hash (never the raw token), and emails a
 * reset link through the shared `sendEmail()` pipeline
 * (`lib/notifications/email.ts` — logs to console in dev when no
 * RESEND_API_KEY is set, so this is fully exercisable locally). Always
 * returns the same generic response regardless of whether the email is
 * registered, so this endpoint can't be used to enumerate accounts. */
import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CustomerModel } from "@/lib/db/models/customer.model";
import { sendEmail } from "@/lib/notifications/email";
import { absoluteUrl } from "@/lib/seo/site-url";
import { customerForgotPasswordSchema } from "@/lib/validators/customer.schema";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { customerPasswordResetRateLimit } from "@/lib/rate-limit/client";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import { isIpWhitelisted } from "@/lib/rate-limit/whitelist";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = customerForgotPasswordSchema.parse(body);

    const ip = getClientIp(req);
    const limited = await enforceRateLimit(
      customerPasswordResetRateLimit,
      `${ip}:${email.toLowerCase()}`,
      "Too many reset requests. Please wait a while and try again.",
      { bypass: isIpWhitelisted(ip) }
    );
    if (limited) return limited;

    await connectToDatabase();
    const customer = await CustomerModel.findOne({ email: email.toLowerCase(), active: true });

    // Only actually mint a token + send an email if the account exists,
    // but the HTTP response is identical either way (see module doc).
    if (customer) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      customer.resetTokenHash = await bcrypt.hash(rawToken, 10);
      customer.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await customer.save();

      const resetLink = absoluteUrl(
        `/reset-password?email=${encodeURIComponent(customer.email)}&token=${rawToken}`
      );

      await sendEmail({
        to: customer.email,
        subject: "Reset your password",
        html: `<p>Hi ${customer.name},</p><p>Click the link below to reset your password. This link expires in 30 minutes.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      });
    }

    return ok({
      sent: true,
      devHint:
        process.env.NODE_ENV !== "production"
          ? "Development mode: check the server console for the reset link (no email provider configured)."
          : undefined,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
