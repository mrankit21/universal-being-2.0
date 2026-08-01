/**
 * Step 8C — Production Payment Ecosystem configuration.
 *
 * Same philosophy as `lib/config/booking-config.ts`: every knob that isn't
 * genuinely per-record data lives here, sourced from environment variables
 * where it makes sense, so ops can tune behaviour without a code change.
 * Nothing here is a secret — secrets (RAZORPAY_KEY_SECRET, provider API
 * keys) stay in `lib/payments/razorpay.ts` / `lib/notifications/*` reading
 * `process.env` directly.
 */

/** Invoice numbers look like `UB-2026-000001` — prefix-year-sequence, reset
 * per calendar year. The prefix is the only piece an operator might want to
 * change (white-label / rebrand); the year + zero-padded sequence are
 * always derived, never hardcoded elsewhere. */
export function getInvoicePrefix(): string {
  return process.env.INVOICE_PREFIX?.trim() || "UB";
}

export function getInvoiceSequencePadding(): number {
  const raw = Number(process.env.INVOICE_SEQUENCE_PADDING);
  return Number.isFinite(raw) && raw > 0 ? raw : 6;
}

export function formatInvoiceNumber(year: number, sequence: number): string {
  return `${getInvoicePrefix()}-${year}-${String(sequence).padStart(getInvoiceSequencePadding(), "0")}`;
}

/** GST-ready fields — left blank/0 until the business is actually
 * registered; wired into the invoice template either way so turning GST on
 * later is a config change, not a re-implementation. */
export function getGstConfig() {
  return {
    gstin: process.env.BUSINESS_GSTIN || "",
    gstRatePercent: Number(process.env.GST_RATE_PERCENT || 0),
    legalBusinessName: process.env.BUSINESS_LEGAL_NAME || "Universal Being",
    registeredAddress: process.env.BUSINESS_REGISTERED_ADDRESS || "",
  };
}

/** Payment retry — Part 3. No hard ceiling by default ("unlimited future
 * support" per spec); PAYMENT_MAX_RETRY_ATTEMPTS is an optional safety cap
 * an operator can set to stop abuse (e.g. someone hammering retry). */
export function getMaxRetryAttempts(): number {
  const raw = Number(process.env.PAYMENT_MAX_RETRY_ATTEMPTS);
  return Number.isFinite(raw) && raw > 0 ? raw : Infinity;
}

/** How long a fresh retry order stays valid before the customer should be
 * told to retry again — mirrors the booking reservation window so retrying
 * payment doesn't outlive the seat hold. */
export function getRetryOrderExpiryMinutes(): number {
  const raw = Number(process.env.PAYMENT_RETRY_ORDER_EXPIRY_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : 15;
}

/** Notification provider selection — Parts 9/10. Architecture-only: when no
 * provider is configured, the "console" provider is used, which just logs
 * (and records in Mongo) instead of sending, so the whole pipeline
 * (booking created -> notify) can be exercised in dev without a real
 * Resend/Twilio/WhatsApp Business account. */
export type EmailProviderName = "console" | "resend";
export function getEmailProvider(): EmailProviderName {
  return process.env.RESEND_API_KEY ? "resend" : "console";
}

export type WhatsAppProviderName = "console" | "whatsapp-cloud-api";
export function getWhatsAppProvider(): WhatsAppProviderName {
  return process.env.WHATSAPP_CLOUD_API_TOKEN ? "whatsapp-cloud-api" : "console";
}

/** Resend's `from` field accepts a bare address or a `"Name <email>"` pair
 * — using the latter is what makes the sender show up as "Universal Being"
 * (not just a raw address) in the customer's inbox. `NOTIFICATIONS_FROM_EMAIL`
 * can be set either way in the environment; if it's a bare address we wrap
 * it with the display name ourselves so ops only ever has to get the
 * address right. Default fallback address matches the live domain
 * (`universalbeing.in`, same as `getSiteUrl()`) — this is only ever used if
 * the env var is unset, and that domain must be verified for sending in the
 * Resend dashboard or delivery will fail. */
export function getSenderEmail(): string {
  const configured = process.env.NOTIFICATIONS_FROM_EMAIL?.trim();
  const address = configured || "bookings@universalbeing.in";
  return address.includes("<") ? address : `Universal Being <${address}>`;
}

/** Refund window — Part 6. Purely informational default surfaced to admins
 * when reviewing a refund request; doesn't block refund creation (admin can
 * always override), just flags requests outside policy. */
export function getRefundPolicyDays(): number {
  const raw = Number(process.env.REFUND_POLICY_DAYS);
  return Number.isFinite(raw) && raw > 0 ? raw : 7;
}
