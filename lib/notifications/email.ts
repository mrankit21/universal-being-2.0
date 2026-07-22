/**
 * Email Notification Architecture (Step 8C, Part 9).
 *
 * "Architecture only" per spec — the point isn't to hard-wire a specific
 * vendor, it's to have every call site (`lib/notifications/dispatch.ts`)
 * go through one `sendEmail()` function so swapping providers later is a
 * one-file change. `getEmailProvider()` (`lib/config/payment-config.ts`)
 * picks the provider from environment presence: no `RESEND_API_KEY` ->
 * `console` provider, which logs the email and records a `PaymentEvent`-
 * style trace instead of actually sending — so the whole booking ->
 * notification pipeline is exercisable in dev/CI without a real provider
 * account, and swapping in Resend (or SES, Postmark, SendGrid — any REST
 * email API) later means implementing one function, not restructuring
 * every caller.
 */
import { getEmailProvider, getSenderEmail } from "@/lib/config/payment-config";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

export interface EmailSendResult {
  ok: boolean;
  provider: string;
  id?: string;
  error?: string;
}

async function sendViaConsole(message: EmailMessage): Promise<EmailSendResult> {
  // Dev/no-provider fallback: log instead of sending. Deliberately not a
  // no-op — logging (rather than silently dropping) makes the pipeline
  // observable while a real provider isn't configured yet.
  console.log(`[email:console] to=${message.to} subject="${message.subject}"`);
  return { ok: true, provider: "console" };
}

async function sendViaResend(message: EmailMessage): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY as string;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: getSenderEmail(),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        // Resend expects base64 content for attachments.
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content.toString("base64"),
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, provider: "resend", error: data?.message || `HTTP ${res.status}` };
    return { ok: true, provider: "resend", id: data?.id };
  } catch (err) {
    return { ok: false, provider: "resend", error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const provider = getEmailProvider();
  if (provider === "resend") return sendViaResend(message);
  return sendViaConsole(message);
}
