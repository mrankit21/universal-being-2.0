/** POST /api/customer/auth/login — verifies credentials against the
 * `Customer` collection and issues a session cookie. Same brute-force
 * protection pattern as the admin login route, keyed by IP+email. */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CustomerModel } from "@/lib/db/models/customer.model";
import { verifyPassword } from "@/lib/auth/password";
import { issueCustomerLoginSession } from "@/lib/auth/issue-customer-session";
import { customerLoginSchema } from "@/lib/validators/customer.schema";
import { fail, handleApiError } from "@/lib/api-helpers/respond";
import { customerLoginRateLimit } from "@/lib/rate-limit/client";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import { isIpWhitelisted } from "@/lib/rate-limit/whitelist";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = customerLoginSchema.parse(body);

    const ip = getClientIp(req);
    const limited = await enforceRateLimit(
      customerLoginRateLimit,
      `${ip}:${email.toLowerCase()}`,
      "Too many login attempts. Please wait a few minutes and try again.",
      { bypass: isIpWhitelisted(ip) }
    );
    if (limited) return limited;

    await connectToDatabase();
    const customer = await CustomerModel.findOne({ email: email.toLowerCase() });
    if (!customer || !customer.active) return fail("Invalid email or password", 401);

    const validPassword = await verifyPassword(password, customer.passwordHash);
    if (!validPassword) return fail("Invalid email or password", 401);

    return await issueCustomerLoginSession(customer);
  } catch (err) {
    return handleApiError(err);
  }
}
