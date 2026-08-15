/**
 * Meta Lead Ads webhook — Phase 5.
 *
 *   GET  — Meta's one-time subscription handshake. When you register this
 *          URL in the Meta App Dashboard -> Webhooks -> Page/Instagram,
 *          Meta calls this with `hub.mode=subscribe`, `hub.verify_token`,
 *          and `hub.challenge`; we must echo `hub.challenge` back as
 *          plain text if the token matches `META_VERIFY_TOKEN`.
 *
 *   POST — the actual `leadgen` change notification. Meta's payload only
 *          ever contains IDs (page/form/lead), never the customer's
 *          answers — those are fetched separately via the Graph API
 *          (`fetchMetaLeadDetail`) using the server-side page access
 *          token. Every entry is deduped on `metaLeadId`
 *          (`ingestExternalLead`), and we always return 200 for anything
 *          we can't process (unknown object type, fetch failure) so Meta
 *          doesn't retry-storm a delivery that will never succeed —
 *          same reasoning as the Razorpay webhook's "no matching
 *          booking" branch.
 *
 * Configure in Meta App Dashboard: Webhooks -> Page (and, separately,
 * Instagram) -> Subscribe to `leadgen`. Set `META_VERIFY_TOKEN` (any
 * string you choose), `META_APP_SECRET` (App Dashboard -> Settings ->
 * Basic), and `META_PAGE_ACCESS_TOKEN` (a Page access token with
 * `leads_retrieval` permission) in the environment — never in code.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { verifyMetaSignature, fetchMetaLeadDetail, mapMetaFieldData, metaObjectToSource, type MetaLeadgenChange } from "@/lib/crm/meta";
import { ingestExternalLead } from "@/lib/crm/ingest";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ success: false, error: "Verification failed" }, { status: 403 });
}

interface MetaWebhookEntry {
  id: string; // page or IG account id
  time?: number;
  changes?: { field: string; value: MetaLeadgenChange }[];
}

interface MetaWebhookPayload {
  object: string; // "page" | "instagram"
  entry?: MetaWebhookEntry[];
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  let body: MetaWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  await connectToDatabase();

  const source = metaObjectToSource(body.object);
  const leadgenChanges = (body.entry ?? []).flatMap((e) => e.changes ?? []).filter((c) => c.field === "leadgen");

  const results: { leadgenId: string; ok: boolean; created?: boolean }[] = [];

  for (const change of leadgenChanges) {
    const { leadgen_id: leadgenId } = change.value;
    try {
      const detail = await fetchMetaLeadDetail(leadgenId);
      if (!detail) {
        results.push({ leadgenId, ok: false });
        continue;
      }

      const { name, phone, email } = mapMetaFieldData(detail.field_data);
      if (!phone) {
        // Some lead forms only collect email, not phone — the CRM's
        // core flows (WhatsApp follow-up, tel: links) assume a phone
        // number, so a phone-less lead still gets created but is easy
        // to spot as incomplete in the admin list.
        results.push({ leadgenId, ok: false });
        continue;
      }

      const { created } = await ingestExternalLead({
        name: name || "Meta Lead",
        phone,
        email,
        source,
        platform: source === "instagram" ? "Instagram Lead Ads" : "Facebook Lead Ads",
        campaign: detail.campaign_name,
        campaignId: detail.campaign_id,
        adSet: detail.adset_name,
        adSetId: detail.adset_id,
        ad: detail.ad_name,
        adId: detail.ad_id,
        metaLeadId: detail.id,
        metaCreatedTime: detail.created_time,
        createdTime: detail.created_time,
      });

      results.push({ leadgenId, ok: true, created });
    } catch {
      results.push({ leadgenId, ok: false });
    }
  }

  // Always 200 — Meta retries on non-2xx, and per-entry failures above
  // are already the terminal outcome for that entry (no fix a retry
  // would provide, e.g. a lead form with no phone field).
  return NextResponse.json({ success: true, processed: results });
}
