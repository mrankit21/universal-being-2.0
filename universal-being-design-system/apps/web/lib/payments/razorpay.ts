/**
 * Razorpay integration (Feature 3 — "Razorpay Order is created" step of the
 * Booking Expiry Timer workflow).
 *
 * Thin wrapper, no business logic: `app/api/bookings/route.ts` calls
 * `createSlotReservationOrder` right after a seat is reserved, and
 * `app/api/bookings/[id]/verify-payment/route.ts` calls
 * `verifyPaymentSignature` when the client reports a completed payment.
 *
 * Deliberately tolerant of missing keys: if `RAZORPAY_KEY_ID` /
 * `RAZORPAY_KEY_SECRET` aren't configured (e.g. local dev without a
 * Razorpay account), `isRazorpayConfigured()` returns false and the
 * booking flow degrades to "seat reserved, pay-later-manually" instead of
 * throwing — the reservation/expiry timer and remaining-payment
 * architecture all still work without live payment credentials.
 */
import Razorpay from "razorpay";
import crypto from "crypto";

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

let client: Razorpay | null = null;
function getClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID as string,
      key_secret: process.env.RAZORPAY_KEY_SECRET as string,
    });
  }
  return client;
}

export interface CreateOrderInput {
  /** Amount in the currency's smallest unit (e.g. paise for INR) is what
   * Razorpay expects — callers pass rupees here and this function converts. */
  amountInRupees: number;
  currency: string;
  /** Razorpay receipt id — we use the booking id so the order is traceable
   * back to exactly one booking document. */
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  keyId: string;
}

/** Creates a Razorpay order for the "Book Your Slot" amount. Returns null
 * instead of throwing when Razorpay isn't configured, so callers can fall
 * back gracefully rather than failing the whole booking. */
export async function createSlotReservationOrder(input: CreateOrderInput): Promise<RazorpayOrderResult | null> {
  if (!isRazorpayConfigured()) return null;

  const order = await getClient().orders.create({
    amount: Math.round(input.amountInRupees * 100),
    currency: input.currency || "INR",
    receipt: input.receipt,
    notes: input.notes,
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID as string,
  };
}

export interface VerifySignatureInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

/** Verifies the HMAC-SHA256 signature Razorpay's checkout returns on
 * successful payment, per Razorpay's documented verification scheme:
 * signature == HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature({ orderId, paymentId, signature }: VerifySignatureInput): boolean {
  if (!isRazorpayConfigured()) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false; // length mismatch etc. — treat as invalid, not a crash
  }
}

/**
 * Webhook signature verification (Step 8C, Part 1 / Part 12). Razorpay
 * signs the *raw request body* with `RAZORPAY_WEBHOOK_SECRET` (a separate
 * secret from the API key/secret pair, configured in the Razorpay
 * dashboard's Webhooks section) and sends it as the `X-Razorpay-Signature`
 * header. Verifying against the raw body (not a re-serialized/parsed one)
 * is required — any re-stringification can change byte-for-byte content
 * and break the HMAC comparison, which is why the webhook route reads
 * `req.text()` rather than `req.json()` before calling this.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export interface CreateRefundInput {
  paymentId: string;
  /** Amount in rupees to refund; omit for a full refund of the payment. */
  amountInRupees?: number;
  notes?: Record<string, string>;
}

export interface RazorpayRefundResult {
  id: string;
  amount: number;
  status: string;
}

/** Part 6 — Refund System. Issues the refund via Razorpay's Refunds API
 * once an admin has approved a refund request. Razorpay treats a refund
 * `receipt`/idempotency the same way orders do internally, but we also
 * de-dupe on our side (see `app/api/admin/refunds/[id]/route.ts`) so an
 * accidental double-click can't trigger two refunds. */
export async function createRefund(input: CreateRefundInput): Promise<RazorpayRefundResult> {
  const payload: Record<string, unknown> = { notes: input.notes };
  if (typeof input.amountInRupees === "number") {
    payload.amount = Math.round(input.amountInRupees * 100);
  }
  const refund = await getClient().payments.refund(input.paymentId, payload);
  return { id: refund.id, amount: Number(refund.amount), status: String(refund.status) };
}
