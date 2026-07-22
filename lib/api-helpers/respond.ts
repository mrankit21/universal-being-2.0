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
    // Validation failures are almost always caused by the caller, not a
    // server bug, but they're also exactly the kind of thing that's silent
    // on mobile (no DevTools) and easy to miss in a toast — log the field
    // errors so they show up in `npm run dev` output too.
    console.error("[api] validation failed:", JSON.stringify(err.flatten()));
    return fail("Validation failed", 422, err.flatten());
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHENTICATED") return fail("Authentication required", 401);
    if (err.message === "FORBIDDEN") return fail("You do not have permission to do this", 403);
    if (err.message === "NOT_FOUND") return fail("Not found", 404);
    if (
      err.message.startsWith("MONGODB_URI") ||
      err.message.startsWith("SESSION_SECRET") ||
      err.message.startsWith("CRON_SECRET")
    ) {
      console.error("[api] config error:", err.message);
      return fail(err.message, 503);
    }
    // Previously this branch returned err.message to the client without
    // ever logging it server-side — so a genuine unexpected exception
    // (a bad Mongoose write, a thrown error inside attach-to-trip, etc.)
    // left literally nothing in the `npm run dev` terminal, only a toast
    // the user had to catch in the moment. Log the full error + stack so
    // the terminal is always the source of truth for "what actually broke."
    console.error("[api] unhandled error:", err.message, err.stack);
    return fail(err.message, 500);
  }
  console.error("[api] unknown thrown value:", err);
  return fail("Unexpected server error", 500);
}
