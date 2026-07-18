/**
 * Rate limiting (Upstash Redis, REST-based — works from Vercel serverless
 * functions without a persistent TCP connection, unlike a normal Redis
 * client).
 *
 * Three independent ways rate limiting ends up disabled for a given
 * limiter, all funneling into the same `null` result so every caller
 * (`enforceRateLimit`) only has to handle one case ("limiter is null ->
 * skip"), not three:
 *   1. `RATE_LIMIT_ENABLED=false` — explicit global kill switch.
 *   2. `UPSTASH_REDIS_REST_URL`/`_TOKEN` unset — same dev-safe default as
 *      Resend/WhatsApp/Razorpay elsewhere in this codebase: local dev
 *      works with zero Upstash setup.
 *   3. Upstash reachable but erroring at request time — handled in
 *      `enforce.ts`, not here (fail-open on a runtime error, as opposed
 *      to "never configured" here at module-load time).
 */
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import type { Duration } from "@upstash/ratelimit";

// Global kill switch. Defaults to enabled — only an explicit "false"
// turns rate limiting off, so an unset/typo'd value never silently
// disables it.
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== "false";

const redis =
  RATE_LIMIT_ENABLED && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const isRateLimitConfigured = redis !== null;

const DURATION_PATTERN = /^\d+\s?(ms|s|m|h|d)$/;

/**
 * Parses a "<tokens>,<window>" env value (e.g. `LOGIN_RATE_LIMIT="5,15 m"`)
 * into `{ tokens, window }`. Falls back to the given default — logging
 * why — if the env var is unset or malformed, so a typo can never take an
 * endpoint's rate limiting down entirely; it just reverts to a known-good
 * default for that one limiter.
 */
function parseRateLimitEnv(
  raw: string | undefined,
  fallback: { tokens: number; window: Duration },
  envVarName: string
): { tokens: number; window: Duration } {
  if (!raw) return fallback;

  const commaIndex = raw.indexOf(",");
  const tokensPart = commaIndex === -1 ? "" : raw.slice(0, commaIndex).trim();
  const windowPart = commaIndex === -1 ? "" : raw.slice(commaIndex + 1).trim();
  const tokens = Number(tokensPart);

  if (!Number.isFinite(tokens) || tokens <= 0 || !DURATION_PATTERN.test(windowPart)) {
    console.error(
      `[rate-limit] Invalid ${envVarName}="${raw}" (expected "<tokens>,<window>", ` +
        `e.g. "5,15 m"). Falling back to default ${fallback.tokens},${fallback.window}.`
    );
    return fallback;
  }

  return { tokens, window: windowPart as Duration };
}

function makeLimiter(
  envValue: string | undefined,
  fallback: { tokens: number; window: Duration },
  envVarName: string,
  redisPrefix: string
) {
  if (!redis) return null;
  const { tokens, window } = parseRateLimitEnv(envValue, fallback, envVarName);
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `ub:ratelimit:${redisPrefix}`,
    analytics: false,
  });
}

/** POST /api/auth/login — keyed by IP+email so one bad actor spraying
 * many emails from one IP, or one email hit from many IPs, both still
 * get capped. Default: 5 attempts / 15 min. Override with
 * `LOGIN_RATE_LIMIT="<tokens>,<window>"`, e.g. `LOGIN_RATE_LIMIT=5,15 m`. */
export const loginRateLimit = makeLimiter(
  process.env.LOGIN_RATE_LIMIT,
  { tokens: 5, window: "15 m" },
  "LOGIN_RATE_LIMIT",
  "login"
);

/** POST /api/auth/otp/request — keyed by mobile number (the actual cost
 * driver — each send is a paid SMS). Default: 3 / 10 min. Override with
 * `OTP_RATE_LIMIT="<tokens>,<window>"`. */
export const otpRequestRateLimit = makeLimiter(
  process.env.OTP_RATE_LIMIT,
  { tokens: 3, window: "10 m" },
  "OTP_RATE_LIMIT",
  "otp-request"
);

/** POST /api/customer/auth/login — keyed by IP+email, same reasoning as
 * the admin login limiter above. Default: 5 attempts / 15 min. Override
 * with `CUSTOMER_LOGIN_RATE_LIMIT="<tokens>,<window>"`. */
export const customerLoginRateLimit = makeLimiter(
  process.env.CUSTOMER_LOGIN_RATE_LIMIT,
  { tokens: 5, window: "15 m" },
  "CUSTOMER_LOGIN_RATE_LIMIT",
  "customer-login"
);

/** POST /api/customer/auth/signup — keyed by IP. Default: 5 / hour, loose
 * enough for a real family signing up multiple accounts from one
 * connection but tight enough to blunt scripted account creation.
 * Override with `CUSTOMER_SIGNUP_RATE_LIMIT="<tokens>,<window>"`. */
export const customerSignupRateLimit = makeLimiter(
  process.env.CUSTOMER_SIGNUP_RATE_LIMIT,
  { tokens: 5, window: "1 h" },
  "CUSTOMER_SIGNUP_RATE_LIMIT",
  "customer-signup"
);

/** POST /api/customer/auth/forgot-password — keyed by IP+email, same
 * pattern as login. Each hit sends a real email, so this caps both abuse
 * and cost. Default: 3 / 30 min. Override with
 * `CUSTOMER_PASSWORD_RESET_RATE_LIMIT="<tokens>,<window>"`. */
export const customerPasswordResetRateLimit = makeLimiter(
  process.env.CUSTOMER_PASSWORD_RESET_RATE_LIMIT,
  { tokens: 3, window: "30 m" },
  "CUSTOMER_PASSWORD_RESET_RATE_LIMIT",
  "customer-password-reset"
);

/** POST /api/bookings — keyed by IP. Default: 10 / min, generous enough
 * for a real customer retrying a form, enough to blunt a script hammering
 * the seat reservation endpoint. Override with
 * `BOOKING_RATE_LIMIT="<tokens>,<window>"`. */
export const bookingsRateLimit = makeLimiter(
  process.env.BOOKING_RATE_LIMIT,
  { tokens: 10, window: "1 m" },
  "BOOKING_RATE_LIMIT",
  "bookings"
);

/** POST /api/coupons/validate — keyed by IP, same reasoning as bookings.
 * Default: 10 / min. Override with `COUPON_RATE_LIMIT="<tokens>,<window>"`. */
export const couponValidateRateLimit = makeLimiter(
  process.env.COUPON_RATE_LIMIT,
  { tokens: 10, window: "1 m" },
  "COUPON_RATE_LIMIT",
  "coupon-validate"
);
