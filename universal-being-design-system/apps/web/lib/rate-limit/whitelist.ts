/**
 * Rate-limit bypass whitelist — env-driven so it can differ per
 * environment (e.g. an office/VPN IP allowed in staging, nothing
 * whitelisted in prod) without a code change or redeploy.
 *
 * Two lists because the four rate-limited routes key on different
 * identifiers: /api/bookings, /api/coupons/validate, and (partly)
 * /api/auth/login are keyed by IP, but /api/auth/otp/request is keyed by
 * mobile number — an IP whitelist alone wouldn't let an admin test the
 * OTP flow from a number they're repeatedly requesting codes for.
 *
 * Not a security boundary: an IP or mobile number is exactly as spoofable
 * as it always is. This exists to unblock trusted testers, not to gate
 * anything sensitive — treat it the same as you'd treat any other
 * "skip this check in staging" env var.
 */
function parseList(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

const whitelistedIps = parseList(process.env.RATE_LIMIT_IP_WHITELIST);
const whitelistedMobiles = parseList(process.env.RATE_LIMIT_MOBILE_WHITELIST);

export function isIpWhitelisted(ip: string): boolean {
  return whitelistedIps.has(ip);
}

export function isMobileWhitelisted(mobile: string): boolean {
  return whitelistedMobiles.has(mobile);
}
