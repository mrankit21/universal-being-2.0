/**
 * Server-side session reader for the *customer* session — for use inside
 * Route Handlers and Server Components. Mirrors `lib/auth/current-user.ts`
 * (the admin equivalent) but reads the separate customer cookie.
 */
import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSessionToken, type CustomerSessionClaims } from "./customer-session";

export async function getCurrentCustomer(): Promise<CustomerSessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE.name)?.value;
  if (!token) return null;
  return verifyCustomerSessionToken(token);
}

export async function requireCurrentCustomer(): Promise<CustomerSessionClaims> {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("UNAUTHENTICATED");
  return customer;
}
