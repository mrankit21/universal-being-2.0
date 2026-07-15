/**
 * WhatsApp Notification Architecture (Step 8C, Part 10).
 *
 * Same shape as `lib/notifications/email.ts` — one `sendWhatsApp()` choke
 * point, provider picked by `getWhatsAppProvider()` based on env presence.
 * The `whatsapp-cloud-api` implementation targets Meta's official WhatsApp
 * Business Cloud API (the standard "future API" most teams end up on), but
 * nothing else in the codebase depends on that choice — it's isolated here.
 */
import { getWhatsAppProvider } from "@/lib/config/payment-config";

export interface WhatsAppMessage {
  to: string; // E.164 phone number, e.g. "+919876543210"
  templateName?: string; // WhatsApp Business template name, if using templates
  body: string; // plain-text fallback / session-message body
  variables?: Record<string, string>;
}

export interface WhatsAppSendResult {
  ok: boolean;
  provider: string;
  id?: string;
  error?: string;
}

async function sendViaConsole(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
  console.log(`[whatsapp:console] to=${message.to} body="${message.body}"`);
  return { ok: true, provider: "console" };
}

async function sendViaCloudApi(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN as string;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneNumberId) return { ok: false, provider: "whatsapp-cloud-api", error: "WHATSAPP_PHONE_NUMBER_ID not set" };

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.to.replace(/[^\d+]/g, ""),
        type: "text",
        text: { body: message.body },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, provider: "whatsapp-cloud-api", error: data?.error?.message || `HTTP ${res.status}` };
    return { ok: true, provider: "whatsapp-cloud-api", id: data?.messages?.[0]?.id };
  } catch (err) {
    return { ok: false, provider: "whatsapp-cloud-api", error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function sendWhatsApp(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const provider = getWhatsAppProvider();
  if (provider === "whatsapp-cloud-api") return sendViaCloudApi(message);
  return sendViaConsole(message);
}
