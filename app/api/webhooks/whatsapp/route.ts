/**
 * WhatsApp inbound webhook — Phase 6 ("Website + WhatsApp Leads").
 *
 * Reuses the *same* Meta App as Phase 5's Lead Ads webhook and the
 * existing outbound `lib/notifications/whatsapp.ts` integration — a
 * WhatsApp Business phone number lives under a Meta App, so this is
 * just a second webhook subscription (`messages` instead of `leadgen`)
 * on that same app, signed with the same `META_APP_SECRET`.
 *
 *   GET  — verification handshake, same shape as the Meta Lead Ads
 *          webhook's GET, but checked against `WHATSAPP_VERIFY_TOKEN`
 *          (falls back to `META_VERIFY_TOKEN` if that's not set, since
 *          it's common to reuse one token for every webhook on the app).
 *
 *   POST — inbound message notifications. For each message:
 *     1. Look up any existing CrmLead for that phone number (any source
 *        — see lib/crm/reply.ts) and, if found, just record the reply
 *        (updates `lastCustomerReplyAt`, one timeline line — not a full
 *        message log, per the roadmap's "no call/message history" rule).
 *     2. If no lead exists yet, create one — "like Meta ads": a first
 *        WhatsApp message with no prior lead becomes a lead on its own,
 *        auto-assigned via the same round robin as everything else.
 *     3. If the message carries a `referral` (i.e. it came from a
 *        "Click to WhatsApp" ad), campaign/ad attribution is captured
 *        the same way Phase 5 captures it for Lead Ads.
 *
 * Configure in Meta App Dashboard: WhatsApp -> Configuration -> Webhook
 * -> subscribe to `messages` on the same phone number already used for
 * `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_CLOUD_API_TOKEN`.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { verifyMetaSignature } from "@/lib/crm/meta";
import { ingestExternalLead } from "@/lib/crm/ingest";
import { findLeadByPhone, recordCustomerReply } from "@/lib/crm/reply";
import { logWebhookEvent, markWebhookProcessed } from "@/lib/crm/webhook-log";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && token && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ success: false, error: "Verification failed" }, { status: 403 });
}

interface WhatsAppReferral {
  source_id?: string; // ad id
  source_type?: string; // "ad" | "post" etc.
  headline?: string; // ad name/headline
  body?: string;
}

interface WhatsAppInboundMessage {
  from: string; // wa_id, e.g. "919876543210"
  id: string;
  timestamp: string; // unix seconds, as a string
  type: string;
  text?: { body: string };
  referral?: WhatsAppReferral;
}

interface WhatsAppContact {
  profile?: { name?: string };
  wa_id: string;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry?: {
    changes?: {
      field: string;
      value?: { messages?: WhatsAppInboundMessage[]; contacts?: WhatsAppContact[] };
    }[];
  }[];
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const signatureValid = verifyMetaSignature(rawBody, signature);

  await connectToDatabase();

  // Log the raw delivery FIRST — before signature check, before JSON
  // parsing — same reasoning as the meta-leads webhook: whatever shows
  // up gets a row, so nothing can vanish silently again.
  const eventId = await logWebhookEvent("whatsapp", req, rawBody, signatureValid);

  if (!signatureValid) {
    await markWebhookProcessed(eventId, undefined, "Invalid signature");
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  let body: WhatsAppWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    await markWebhookProcessed(eventId, undefined, "Invalid JSON");
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const changes = (body.entry ?? []).flatMap((e) => e.changes ?? []).filter((c) => c.field === "messages");
  const results: { from: string; ok: boolean; action?: "replied" | "created" }[] = [];
  let lastError: string | undefined;
  let firstMessageId: string | undefined;

  for (const change of changes) {
    const messages = change.value?.messages ?? [];
    const contacts = change.value?.contacts ?? [];

    for (const msg of messages) {
      firstMessageId = firstMessageId ?? msg.id;
      try {
        const contact = contacts.find((c) => c.wa_id === msg.from);
        const preview = msg.text?.body ?? `[${msg.type} message]`;
        const at = new Date(Number(msg.timestamp) * 1000).toISOString();

        const existing = await findLeadByPhone(msg.from);
        if (existing) {
          await recordCustomerReply(existing.leadId, preview, at);
          results.push({ from: msg.from, ok: true, action: "replied" });
          continue;
        }

        // First-ever message from this number with no matching lead —
        // create one, same "automatic, like Meta ads" treatment Phase 5
        // gives a Lead Ads submission.
        await ingestExternalLead({
          name: contact?.profile?.name || "WhatsApp Lead",
          phone: msg.from,
          whatsappNumber: msg.from,
          source: "whatsapp",
          platform: "WhatsApp",
          ad: msg.referral?.headline,
          adId: msg.referral?.source_id,
          campaign: msg.referral?.source_type ? `Click to WhatsApp (${msg.referral.source_type})` : undefined,
          createdTime: at,
        });
        results.push({ from: msg.from, ok: true, action: "created" });
      } catch (err) {
        results.push({ from: msg.from, ok: false });
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
  }

  await markWebhookProcessed(eventId, firstMessageId, lastError);

  // Always 200 — WhatsApp/Meta retries on non-2xx.
  return NextResponse.json({ success: true, processed: results });
}
