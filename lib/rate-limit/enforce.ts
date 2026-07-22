/**
 * Runs a Ratelimit check and returns a ready-to-return 429 response (via
 * the shared `fail()` helper, same shape every other route already uses)
 * if the limit was hit — or `null` if the request should proceed.
 *
 * A route handler uses this as:
 *   const limited = await enforceRateLimit(loginRateLimit, key, "message");
 *   if (limited) return limited;
 *
 * `limiter` being `null` (globally disabled via `RATE_LIMIT_ENABLED=false`,
 * or Upstash env vars not set) is treated as "rate limiting isn't
 * configured here" and always allows the request through — see
 * `lib/rate-limit/client.ts` for why.
 *
 * `options.bypass: true` (e.g. from `lib/rate-limit/whitelist.ts`) skips
 * the check entirely without even calling Redis — used to let a
 * whitelisted admin/QA IP or mobile number through unconditionally.
 *
 * Fails OPEN on any Upstash/Redis error: `limiter.limit()` can throw if
 * Upstash is down, unreachable, or returns a malformed response. Login,
 * booking, and coupon flows must keep working through a Redis outage —
 * losing rate limiting temporarily is an acceptable degradation, taking
 * the whole endpoint down is not. The error is logged so an ongoing
 * outage is still visible in server logs, but it never becomes a 500 to
 * the customer.
 */
import type { Ratelimit } from "@upstash/ratelimit";
import { fail } from "@/lib/api-helpers/respond";

export async function enforceRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
  message: string,
  options?: { bypass?: boolean }
) {
  if (!limiter || options?.bypass) return null;

  try {
    const { success, reset } = await limiter.limit(identifier);
    if (success) return null;

    const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return fail(message, 429, { retryAfterSeconds });
  } catch (err) {
    console.error("[rate-limit] Upstash error — failing open, request allowed:", err);
    return null;
  }
}
