/**
 * POST /api/auth/google — placeholder.
 *
 * "Continue with Google" is intentionally not wired to a real OAuth flow
 * yet: that requires a Google Cloud OAuth client (client ID/secret,
 * authorized redirect URI) that only you can create, plus adding the
 * `next-auth` package. The UI already ships the button + this endpoint so
 * wiring it up later is additive, not a redesign.
 *
 * --- To make this real -------------------------------------------------
 * 1. `npm install next-auth@beta` (Auth.js v5, App Router compatible).
 * 2. Create a Google OAuth client in Google Cloud Console; set
 *    GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env.local.
 * 3. Add `app/api/auth/[...nextauth]/route.ts` with the Google provider,
 *    and in its `signIn` callback, look up `UserModel.findOne({ email })`
 *    — mirror `issueLoginSession` from `lib/auth/issue-login-session.ts`
 *    so a Google sign-in only succeeds for an email that already has an
 *    active admin User record (never auto-creates a new admin from an
 *    arbitrary Google account).
 * 4. Delete this file once that route exists.
 * ------------------------------------------------------------------- */
import { fail } from "@/lib/api-helpers/respond";

export async function POST() {
  return fail(
    "Google sign-in isn't configured yet. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and wire NextAuth (see comments in this file) to enable it.",
    501
  );
}
