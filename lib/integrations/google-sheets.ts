/**
 * Google Sheets sync — new leads get appended as a row to a Google Sheet
 * so the sales team can see them without opening the CRM.
 *
 * Uses a Google service account (no `googleapis` package needed — this
 * repo already carries `jsonwebtoken`, which is enough to mint the OAuth2
 * bearer token by hand: sign a JWT with the service account's private
 * key, exchange it at Google's token endpoint, call the Sheets REST API).
 *
 * Setup (Google Cloud Console):
 *   1. Create/select a project -> "APIs & Services" -> Library -> enable
 *      "Google Sheets API".
 *   2. "APIs & Services" -> Credentials -> Create Credentials -> Service
 *      Account. Give it any name (e.g. "ub-crm-sheets").
 *   3. Open the created service account -> Keys -> Add Key -> Create new
 *      key -> JSON. Downloads a .json file — open it, you need two fields:
 *        - `client_email`  -> GOOGLE_SHEETS_CLIENT_EMAIL
 *        - `private_key`   -> GOOGLE_SHEETS_PRIVATE_KEY
 *   4. Create (or open) the target Google Sheet. Click Share, and share
 *      it with the `client_email` address above as an Editor — the
 *      service account only sees sheets explicitly shared with it.
 *   5. Copy the Sheet ID from its URL:
 *      https://docs.google.com/spreadsheets/d/<THIS_PART>/edit
 *      -> GOOGLE_SHEETS_SPREADSHEET_ID
 *   6. (Optional) GOOGLE_SHEETS_TAB_NAME — the tab/sheet name leads get
 *      appended to. Defaults to "Leads". Row 1 should have headers
 *      matching the order below (Date, Lead ID, Name, Phone, Email,
 *      Source, Platform, Campaign, Status).
 *
 * Never throws — a Sheets failure must not block lead ingestion. Silently
 * no-ops (console.log only) if the env vars aren't set, same pattern as
 * the email/WhatsApp "console" provider fallback elsewhere in this repo.
 */
import jwt from "jsonwebtoken";

export interface SheetLeadRow {
  leadId: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  platform?: string;
  campaign?: string;
  status: string;
  createdAt?: string;
}

function isConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
      process.env.GOOGLE_SHEETS_PRIVATE_KEY &&
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  );
}

/** Mints a short-lived OAuth2 access token for the Sheets API scope using
 * the service account's RS256-signed JWT assertion flow. */
async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL as string;
  // Vercel env vars can't hold literal newlines cleanly — the key is
  // stored with escaped "\n" sequences and unescaped here, same trick
  // used for any PEM key kept in a single-line env var.
  const privateKey = (process.env.GOOGLE_SHEETS_PRIVATE_KEY as string).replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    privateKey,
    { algorithm: "RS256" }
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data?.error_description || data?.error || `Token exchange failed (HTTP ${res.status})`);
  }
  return data.access_token as string;
}

/** Appends one row to the configured sheet. Best-effort: logs and returns
 * `{ ok: false }` on any failure instead of throwing, so a Sheets/Google
 * outage never breaks lead creation. */
export async function appendLeadToSheet(lead: SheetLeadRow): Promise<{ ok: boolean; error?: string }> {
  if (!isConfigured()) {
    console.log(`[google-sheets] not configured, skipping sync for lead ${lead.leadId}`);
    return { ok: false, error: "not configured" };
  }

  try {
    const accessToken = await getAccessToken();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const tab = process.env.GOOGLE_SHEETS_TAB_NAME || "Leads";
    const range = `${tab}!A:I`;

    const row = [
      lead.createdAt || new Date().toISOString(),
      lead.leadId,
      lead.name,
      lead.phone,
      lead.email || "",
      lead.source,
      lead.platform || "",
      lead.campaign || "",
      lead.status,
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        range
      )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const error = data?.error?.message || `HTTP ${res.status}`;
      console.error(`[google-sheets] append failed for lead ${lead.leadId}: ${error}`);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error(`[google-sheets] append threw for lead ${lead.leadId}: ${error}`);
    return { ok: false, error };
  }
}
