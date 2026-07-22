/** POST /api/customer/auth/signup — creates a `Customer` record and
 * immediately issues a session, same as the "Sign Up" tab of the header
 * login modal expects (signup drops the customer straight into a logged-in
 * state, matching the reference UI's "Login & Continue" flow). */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CustomerModel } from "@/lib/db/models/customer.model";
import { hashPassword } from "@/lib/auth/password";
import { issueCustomerLoginSession } from "@/lib/auth/issue-customer-session";
import { customerSignupSchema } from "@/lib/validators/customer.schema";
import { fail, handleApiError } from "@/lib/api-helpers/respond";
import { customerSignupRateLimit } from "@/lib/rate-limit/client";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import { isIpWhitelisted } from "@/lib/rate-limit/whitelist";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = customerSignupSchema.parse(body);

    const ip = getClientIp(req);
    const limited = await enforceRateLimit(
      customerSignupRateLimit,
      ip,
      "Too many signup attempts. Please wait a while and try again.",
      { bypass: isIpWhitelisted(ip) }
    );
    if (limited) return limited;

    await connectToDatabase();

    const existing = await CustomerModel.findOne({ email: email.toLowerCase() });
    if (existing) return fail("An account with this email already exists. Try logging in instead.", 409);

    const passwordHash = await hashPassword(password);
    const customer = await CustomerModel.create({ name, email: email.toLowerCase(), passwordHash });

    return await issueCustomerLoginSession(customer);
  } catch (err) {
    return handleApiError(err);
  }
}
