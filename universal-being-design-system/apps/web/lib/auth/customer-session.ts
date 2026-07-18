/**
 * Customer session token issuance/verification. Mirrors
 * `lib/auth/session.ts` (same `jose` JWT approach, so it runs identically
 * in Route Handlers and `middleware.ts`) but is a fully separate cookie
 * (`ub_customer_session` vs `ub_admin_session`) and claim shape (no
 * `role`) — a customer being logged in never implies anything about
 * admin access, and vice versa. Someone can be logged into both at once
 * in the same browser without either session interfering with the other.
 */
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "ub_customer_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — customers expect to stay logged in

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add a long random string to your environment " +
        "(.env.local in dev) to enable customer authentication. See .env.example."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface CustomerSessionClaims {
  sub: string; // customer id
  email: string;
  name: string;
}

export async function issueCustomerSessionToken(claims: CustomerSessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyCustomerSessionToken(token: string): Promise<CustomerSessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || !payload.email) return null;
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) ?? "",
    };
  } catch {
    return null;
  }
}

export const CUSTOMER_SESSION_COOKIE = {
  name: SESSION_COOKIE_NAME,
  maxAge: SESSION_TTL_SECONDS,
};
