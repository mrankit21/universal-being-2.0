/**
 * SMS provider abstraction for OTP admin login (Architecture-style seam,
 * matching how `lib/auth/session.ts` documents its own eventual swap
 * point). Route handlers never talk to a provider SDK directly — they call
 * `getSmsProvider().sendOtp(...)`, so switching from the dev mock to
 * Firebase/Twilio/MSG91 in production is a one-line change in this file,
 * not a rewrite of the OTP routes.
 */

export interface SmsProvider {
  /** Send `code` to `mobile`. Should throw on failure so the route handler
   * can surface a proper error instead of silently pretending it worked. */
  sendOtp(mobile: string, code: string): Promise<void>;
}

/**
 * Development provider: never calls a real SMS API. Logs the code to the
 * server console so you can see it without needing a phone, and — per the
 * requirement — the code generator below always issues "123456" outside
 * production so you never even have to check the console.
 */
class MockSmsProvider implements SmsProvider {
  async sendOtp(mobile: string, code: string): Promise<void> {
    console.log(`[sms:mock] Would send OTP ${code} to ${mobile} (mock provider — no real SMS sent).`);
  }
}

/**
 * --- Production integration points -----------------------------------
 * Implement one of these and return it from getSmsProvider() below once
 * you have real credentials. Each only needs to satisfy `SmsProvider`.
 *
 * // Firebase (client-side phone auth is more typical, but for a
 * // server-initiated flow you'd usually front this with Firebase Admin +
 * // a proxy, or use one of the SMS-specific providers below instead).
 *
 * // Twilio:
 * // class TwilioSmsProvider implements SmsProvider {
 * //   private client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 * //   async sendOtp(mobile: string, code: string) {
 * //     await this.client.messages.create({
 * //       to: mobile,
 * //       from: process.env.TWILIO_FROM_NUMBER,
 * //       body: `Your Universal Being admin login code is ${code}`,
 * //     });
 * //   }
 * // }
 *
 * // MSG91 (common for India-based sends):
 * // class Msg91SmsProvider implements SmsProvider {
 * //   async sendOtp(mobile: string, code: string) {
 * //     await fetch("https://control.msg91.com/api/v5/otp", {
 * //       method: "POST",
 * //       headers: { authkey: process.env.MSG91_AUTH_KEY!, "Content-Type": "application/json" },
 * //       body: JSON.stringify({ mobile, otp: code, template_id: process.env.MSG91_TEMPLATE_ID }),
 * //     });
 * //   }
 * // }
 * ------------------------------------------------------------------- */

export function getSmsProvider(): SmsProvider {
  // Swap this based on an env var once a real provider is wired up, e.g.:
  //   if (process.env.SMS_PROVIDER === "twilio") return new TwilioSmsProvider();
  return new MockSmsProvider();
}

/**
 * Generates the OTP for a login attempt. Outside production this is always
 * a fixed, documented value so local development never depends on reading
 * server logs or receiving a real SMS. In production it's a random 6-digit
 * code, sent through the real provider.
 */
export function generateOtpCode(): string {
  if (process.env.NODE_ENV !== "production") {
    return "123456";
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}
