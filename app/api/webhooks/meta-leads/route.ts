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
import { logWebhookEvent, markWebhookProcessed } from "@/lib/crm/webhook-log";

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
  const signatureValid = verifyMetaSignature(rawBody, signature);

  await connectToDatabase();

  // Log the raw delivery FIRST — before signature check, before JSON
  // parsing — so a bad-signature or malformed delivery still leaves a
  // row instead of vanishing with zero trace (this is what "leads come
  // on WhatsApp but never show up in CRM" looked like from the outside).
  const eventId = await logWebhookEvent("meta-leads", req, rawBody, signatureValid);

  if (!signatureValid) {
    await markWebhookProcessed(eventId, undefined, "Invalid signature");
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  let body: MetaWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    await markWebhookProcessed(eventId, undefined, "Invalid JSON");
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const source = metaObjectToSource(body.object);
  const leadgenChanges = (body.entry ?? []).flatMap((e) => e.changes ?? []).filter((c) => c.field === "leadgen");

  const results: { leadgenId: string; ok: boolean; created?: boolean }[] = [];
  let lastError: string | undefined;

  for (const change of leadgenChanges) {
    const { leadgen_id: leadgenId } = change.value;
    try {
      const detail = await fetchMetaLeadDetail(leadgenId);
      if (!detail) {
        results.push({ leadgenId, ok: false });
        lastError = `fetchMetaLeadDetail returned null for ${leadgenId}`;
        continue;
      }

      const { name, phone, email } = mapMetaFieldData(detail.field_data);
      // Some lead forms only collect email, not phone. We used to drop
      // these entirely, which silently lost real leads — now it's
      // created with an empty phone so it still shows up in the CRM
      // (as "incomplete"), instead of disappearing.
      const { created } = await ingestExternalLead({
        name: name || "Meta Lead",
        phone: phone || "",
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
    } catch (err) {
      results.push({ leadgenId, ok: false });
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  const dedupeKey = leadgenChanges[0]?.value.leadgen_id;
  await markWebhookProcessed(eventId, dedupeKey, lastError);

  // Always 200 — Meta retries on non-2xx, and per-entry failures above
  // are already the terminal outcome for that entry (no fix a retry
  // would provide, e.g. a lead form with no phone field).
  return NextResponse.json({ success: true, processed: results });
}
