/**
 * Session token issuance/verification using `jose` (Web Crypto based, so it
 * runs identically in the Node route-handler runtime AND the Edge
 * `middleware.ts` runtime — Architecture §7: "protected by middleware
 * checking a role claim (JWT from Express auth)". This file is the eventual
 * drop-in replacement point once that claim is issued by a real Express
 * auth service instead of a Next.js Route Handler.
 */
import { SignJWT, jwtVerify } from "jose";
import type { AdminRole } from "@/lib/db/models/user.model";

const SESSION_COOKIE_NAME = "ub_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add a long random string to your environment " +
        "(.env.local in dev) to enable admin authentication. See .env.example."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionClaims {
  sub: string; // user id
  email: string;
  name: string;
  role: AdminRole;
}

export async function issueSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) ?? "",
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = {
  name: SESSION_COOKIE_NAME,
  maxAge: SESSION_TTL_SECONDS,
};
