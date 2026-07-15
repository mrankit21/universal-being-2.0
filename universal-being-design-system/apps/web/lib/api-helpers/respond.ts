/** Small, consistent JSON response + error helpers shared by every Route
 * Handler under `app/api/**` (requirement #13 — "clean API structure"). */
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

/** Normalizes thrown errors (Zod validation, our own Error, unknown) into a
 * consistent API error shape so route handlers don't each re-implement
 * try/catch formatting. */
export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return fail("Validation failed", 422, err.flatten());
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHENTICATED") return fail("Authentication required", 401);
    if (err.message === "FORBIDDEN") return fail("You do not have permission to do this", 403);
    if (err.message === "NOT_FOUND") return fail("Not found", 404);
    if (err.message.startsWith("MONGODB_URI") || err.message.startsWith("SESSION_SECRET")) {
      return fail(err.message, 503);
    }
    return fail(err.message, 500);
  }
  return fail("Unexpected server error", 500);
}
