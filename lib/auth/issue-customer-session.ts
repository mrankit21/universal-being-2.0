/**
 * Single choke point for "log this customer in and hand back the
 * response" — every customer login method (password login, and signup
 * immediately logging the new customer in) calls this instead of
 * duplicating cookie/JWT logic. Mirrors `lib/auth/issue-login-session.ts`
 * for the admin side.
 */
import { ok } from "@/lib/api-helpers/respond";
import { issueCustomerSessionToken, CUSTOMER_SESSION_COOKIE } from "@/lib/auth/customer-session";
import type { CustomerDocument } from "@/lib/db/models/customer.model";

export async function issueCustomerLoginSession(customer: CustomerDocument) {
  const token = await issueCustomerSessionToken({
    sub: customer.id,
    email: customer.email,
    name: customer.name,
  });

  customer.lastLoginAt = new Date().toISOString();
  await customer.save();

  const response = ok({ id: customer.id, name: customer.name, email: customer.email });
  response.cookies.set(CUSTOMER_SESSION_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_COOKIE.maxAge,
  });
  return response;
}
