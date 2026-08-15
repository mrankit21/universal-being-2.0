/**
 * Meta Lead Ads integration — Phase 5. Facebook + Instagram Lead Ads
 * both flow through the same webhook (Meta's `leadgen` change
 * notification), so one set of helpers covers both, distinguished by the
 * `platform` field the Graph API returns for the underlying page.
 *
 * Architecture (per the roadmap):
 *   Meta Lead Form -> Meta Webhook -> this route -> Graph API fetch ->
 *   MongoDB (CrmLead) -> round-robin Assignment
 *
 * Credentials never leave the server: `META_APP_SECRET` (webhook
 * signature) and `META_PAGE_ACCESS_TOKEN` (Graph API reads) are read
 * from `process.env` only, exactly like `RAZORPAY_KEY_SECRET` in
 * `lib/payments/razorpay.ts` — never sent to the client, never logged.
 */
import crypto from "crypto";

/** Verifies `X-Hub-Signature-256` against the raw request body, same
 * HMAC pattern as `verifyWebhookSignature` in lib/payments/razorpay.ts.
 * Meta prefixes the header value with `sha256=`. */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signatureHeader) return false;
  const [, signature] = signatureHeader.split("sha256=");
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Shape Meta's webhook sends per changed leadgen entry — just enough
 * to know *which* lead to go fetch; the webhook payload itself never
 * contains the customer's answers. */
export interface MetaLeadgenChange {
  leadgen_id: string;
  page_id: string;
  form_id: string;
  ad_id?: string;
  adgroup_id?: string; // older field name for ad_id on some API versions
  created_time?: number;
}

export interface MetaLeadFieldData {
  name: string;
  value: string;
}

export interface MetaLeadDetail {
  id: string;
  created_time: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  form_id?: string;
  field_data: MetaLeadFieldData[];
}

/** Fetches the full lead (name/phone/email answers + campaign
 * attribution) from the Graph API using the leadgen_id the webhook gave
 * us — the webhook notification itself never includes the answers, only
 * an ID to go look them up with the page access token. */
export async function fetchMetaLeadDetail(leadgenId: string): Promise<MetaLeadDetail | null> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) return null;

  const fields = "id,created_time,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,form_id,field_data";
  const res = await fetch(`https://graph.facebook.com/v21.0/${leadgenId}?fields=${fields}&access_token=${token}`);
  if (!res.ok) return null;
  return res.json();
}

/** Maps Meta's arbitrary `field_data` question/answer pairs onto the
 * handful of CrmLead fields we actually store — question `name`s vary by
 * how each Lead Form was built in Meta Ads Manager, so this matches on
 * common variants rather than one fixed key. */
export function mapMetaFieldData(fieldData: MetaLeadFieldData[]): {
  name?: string;
  phone?: string;
  email?: string;
} {
  const get = (...keys: string[]) => fieldData.find((f) => keys.includes(f.name.toLowerCase()))?.value;
  return {
    name: get("full_name", "name", "first_name"),
    phone: get("phone_number", "phone"),
    email: get("email"),
  };
}

/** Which page a lead form belongs to determines Facebook vs Instagram —
 * the leadgen webhook payload doesn't say directly, so this is set from
 * the `object` field Meta sends at the top of the webhook body
 * ("page" for Facebook forms served on a Page, "instagram" for IG). */
export function metaObjectToSource(object: string): "facebook" | "instagram" | "meta" {
  if (object === "instagram") return "instagram";
  if (object === "page") return "facebook";
  return "meta";
}
