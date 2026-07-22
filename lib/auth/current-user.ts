/**
 * Server-side session reader for use inside Route Handlers and Server
 * Components (Node runtime — uses `next/headers`). `middleware.ts` handles
 * the Edge-runtime equivalent for route gating; this is for reading *who*
 * is logged in once a request already passed the gate.
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type SessionClaims } from "./session";

export async function getCurrentUser(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE.name)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireCurrentUser(): Promise<SessionClaims> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
