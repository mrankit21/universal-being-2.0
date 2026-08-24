/**
 * Shared "log first, process second" helper for the Meta webhooks
 * (Lead Ads + WhatsApp). Call `logWebhookEvent` as the very first line
 * of POST, before signature verification — that way even a rejected
 * (bad signature) or malformed delivery leaves a row, which is exactly
 * the case that used to disappear without a trace.
 */
import { NextRequest } from "next/server";
import { WebhookEventModel, type WebhookEventSource } from "@/lib/db/models/webhook-event.model";

export async function logWebhookEvent(
  source: WebhookEventSource,
  req: NextRequest,
  rawBody: string,
  signatureValid: boolean
) {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  try {
    const doc = await WebhookEventModel.create({
      source,
      receivedAt: new Date().toISOString(),
      headers,
      rawBody,
      signatureValid,
      processed: false,
    });
    return String(doc._id);
  } catch {
    // Logging must never block the actual webhook response — if the
    // DB write itself fails, fall through with no id; processing still
    // proceeds normally.
    return null;
  }
}

export async function markWebhookProcessed(id: string | null, dedupeKey?: string, error?: string) {
  if (!id) return;
  try {
    await WebhookEventModel.updateOne(
      { _id: id },
      { $set: { processed: !error, error, ...(dedupeKey ? { dedupeKey } : {}) } }
    );
  } catch {
    // Best-effort — never throw from here, the webhook response already went out.
  }
}
