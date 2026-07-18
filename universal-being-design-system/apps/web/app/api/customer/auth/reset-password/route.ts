/** POST /api/customer/auth/reset-password — second half of the forgot-
 * password flow. Verifies the raw token from the emailed link against the
 * stored bcrypt hash, and if valid, sets the new password and immediately
 * logs the customer in (same as after signup) so they don't have to
 * re-enter credentials right after resetting them. */
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CustomerModel } from "@/lib/db/models/customer.model";
import { hashPassword } from "@/lib/auth/password";
import { issueCustomerLoginSession } from "@/lib/auth/issue-customer-session";
import { customerResetPasswordSchema } from "@/lib/validators/customer.schema";
import { fail, handleApiError } from "@/lib/api-helpers/respond";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, token, password } = customerResetPasswordSchema.parse(body);

    await connectToDatabase();
    const customer = await CustomerModel.findOne({ email: email.toLowerCase(), active: true }).select(
      "+resetTokenHash +resetTokenExpiresAt"
    );

    if (!customer || !customer.resetTokenHash || !customer.resetTokenExpiresAt) {
      return fail("This reset link is invalid or has expired. Request a new one.", 401);
    }
    if (customer.resetTokenExpiresAt.getTime() < Date.now()) {
      return fail("This reset link has expired. Request a new one.", 401);
    }

    const validToken = await bcrypt.compare(token, customer.resetTokenHash);
    if (!validToken) return fail("This reset link is invalid or has expired. Request a new one.", 401);

    customer.passwordHash = await hashPassword(password);
    customer.resetTokenHash = undefined;
    customer.resetTokenExpiresAt = undefined;

    return await issueCustomerLoginSession(customer);
  } catch (err) {
    return handleApiError(err);
  }
}
