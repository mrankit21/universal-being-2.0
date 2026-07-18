/**
 * POST /api/customer/auth/google — placeholder.
 *
 * "Sign in with Google" is intentionally not wired to a real OAuth flow
 * yet, same situation as `app/api/auth/google/route.ts` on the admin
 * side: it needs a Google Cloud OAuth client (client ID/secret, authorized
 * redirect URI) that only you can create, plus the `next-auth` package.
 * The UI already ships the button + this endpoint so wiring it up later is
 * additive, not a redesign.
 *
 * --- To make this real -------------------------------------------------
 * 1. `npm install next-auth@beta` (Auth.js v5, App Router compatible).
 * 2. Create a Google OAuth client in Google Cloud Console; set
 *    GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env.local.
 * 3. Add a NextAuth route with the Google provider. In its `signIn`
 *    callback, upsert into `CustomerModel` by email (unlike the admin
 *    version, a customer Google sign-in SHOULD be allowed to create a new
 *    account automatically — there's no fixed admin allowlist to check
 *    against) and mirror `issueCustomerLoginSession` from
 *    `lib/auth/issue-customer-session.ts` so it produces the exact same
 *    session cookie as password login/signup.
 * 4. Delete this file once that route exists.
 * ------------------------------------------------------------------- */
import { fail } from "@/lib/api-helpers/respond";

export async function POST() {
  return fail(
    "Google sign-in isn't configured yet. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and wire NextAuth (see comments in this file) to enable it.",
    501
  );
}
