/**
 * Meta Conversions API (CAPI) — server-side conversion events.
 *
 * Sends a "this lead actually converted" signal directly from our server
 * to Meta's Events Manager, bypassing the browser pixel entirely (no
 * cookie/ad-blocker loss). This is what lets Meta's ad algorithm learn
 * which leads turn into real, paid bookings and optimize delivery toward
 * similar people.
 *
 * Trigger point: `linkLeadOnPaymentReceived()` in `lib/crm/booking-link.ts`
 * and the manual "Booked" status change in the admin CRM
 * (`app/api/admin/crm/leads/[id]/route.ts`) — see `sendLeadConversionEvent()`
 * below, which both call into.
 *
 * Required env vars (Vercel):
 *   META_PIXEL_ID              — Events Manager -> Data Sources -> your
 *                                 pixel -> Settings -> Pixel ID (a number).
 *   META_CONVERSIONS_API_TOKEN — Events Manager -> Data Sources -> your
 *                                 pixel -> Settings -> Conversions API ->
 *                                 "Generate access token" (this is a
 *                                 long-lived token scoped to that pixel —
 *                                 different from META_PAGE_ACCESS_TOKEN,
 *                                 which is scoped to the Page for Lead Ads).
 *
 * If either var is missing, every call here is a no-op that logs and
 * returns — exactly like the existing WhatsApp/email "log instead of
 * send" dev-safe fallback pattern in this codebase, so local dev and a
 * not-yet-configured production deploy never throw.
 */
import crypto from "crypto";

const META_GRAPH_VERSION = "v21.0";

/** Meta requires PII (email, phone) sent as lowercased, trimmed SHA-256
 * hashes — never in plaintext. Phone must be in E.164-ish digits-only
 * form (Meta strips leading zeros/symbols internally, but stripping
 * everything except digits ourselves first is the documented-safe way). */
function hashForMeta(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function hashPhone(phone: string): string {
  const digitsOnly = phone.replace(/[^\d]/g, "");
  return hashForMeta(digitsOnly);
}

export type MetaConversionEvent = {
  /** Meta standard event name. "Lead" for a qualified/interested lead,
   * "Purchase" for a completed, paid booking (has a value). */
  eventName: "Lead" | "Purchase";
  /** Stable id for de-duplication if this event is ever also fired from
   * the browser Pixel for the same action — we only use server-side CAPI
   * here, but this is cheap insurance. Use the CRM leadId. */
  eventId: string;
  /** Customer identifiers — at least one of phone/email should be given
   * for good match quality. Pass raw (unhashed) values; this function
   * hashes them. */
  phone?: string;
  email?: string;
  /** Booking value, if this is a Purchase event. */
  value?: number;
  currency?: string;
  /** The lead's own page, if you have one users actually landed on
   * (falls back to the site root). */
  sourceUrl?: string;
};

/**
 * Sends one event to Meta's Conversions API. Never throws — a failure
 * here must never break the CRM's own lead-update flow, so every error
 * is caught and logged, and the function returns a simple success flag
 * the caller can log into the lead's activity timeline if it wants to.
 */
export async function sendMetaConversionEvent(event: MetaConversionEvent): Promise<{ ok: boolean; error?: string }> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CONVERSIONS_API_TOKEN;

  if (!pixelId || !token) {
    console.log(
      `[meta-capi] META_PIXEL_ID / META_CONVERSIONS_API_TOKEN not set — skipping "${event.eventName}" event for ${event.eventId} (dev-safe no-op)`
    );
    return { ok: false, error: "not_configured" };
  }

  const userData: Record<string, string[]> = {};
  if (event.phone) userData.ph = [hashPhone(event.phone)];
  if (event.email) userData.em = [hashForMeta(event.email)];

  const customData: Record<string, unknown> = {};
  if (event.value !== undefined) customData.value = event.value;
  if (event.currency) customData.currency = event.currency;

  const body = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "system_generated", // this is a backend/CRM-driven event, not a browser pageview
        event_source_url: event.sourceUrl ?? "https://universalbeing.in",
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[meta-capi] Meta rejected "${event.eventName}" event for ${event.eventId}: ${res.status} ${text}`);
      return { ok: false, error: `meta_error_${res.status}` };
    }

    console.log(`[meta-capi] Sent "${event.eventName}" event for ${event.eventId}`);
    return { ok: true };
  } catch (err) {
    console.error(`[meta-capi] Failed to send "${event.eventName}" event for ${event.eventId}:`, err);
    return { ok: false, error: "network_error" };
  }
}

/**
 * Convenience wrapper for the one case this CRM actually needs right
 * now: a lead's status just became "booked" (a real, paid booking).
 * Fires a "Purchase" event since we have a real value — this is a much
 * stronger optimization signal for Meta's algorithm than a plain "Lead"
 * event would be, since Meta can now learn from *how much* people spend,
 * not just that they enquired.
 */
export async function sendLeadConversionEvent(lead: {
  leadId: string;
  phone?: string;
  email?: string;
  amountPaid?: number;
}): Promise<{ ok: boolean; error?: string }> {
  return sendMetaConversionEvent({
    eventName: "Purchase",
    eventId: lead.leadId,
    phone: lead.phone,
    email: lead.email,
    value: lead.amountPaid,
    currency: "INR",
  });
}
