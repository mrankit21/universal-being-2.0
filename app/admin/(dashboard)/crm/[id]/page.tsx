"use client";

/**
 * CRM lead detail — Phase 2 adds the one-click status action bar
 * (StatusActionBar) in place of the Phase 1 status dropdown, plus the
 * "Close Lead" inline reason picker. Everything else (follow-up, notes,
 * timeline) is unchanged from Phase 1 and already worked the same way.
 */
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LeadAssigneeSelect, type Salesperson } from "@/components/admin/lead-assignee-select";
import { StatusActionBar } from "@/components/admin/crm/status-action-bar";
import { CRM_LEAD_STATUS_LABELS, CRM_LEAD_SOURCE_LABELS, type CrmLeadStatus } from "@/lib/crm/constants";

interface CrmLeadDetail {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  destination?: string;
  travelTiming?: string;
  paxCount?: number;
  budget?: string;
  source: string;
  platform?: string;
  campaign?: string;
  campaignId?: string;
  adSet?: string;
  adSetId?: string;
  ad?: string;
  adId?: string;
  metaLeadId?: string;
  status: CrmLeadStatus;
  lostReason?: string;
  assignedTo?: string;
  assignedAt?: string;
  lastActivityAt: string;
  lastCustomerReplyAt?: string;
  nextFollowUpAt?: string;
  followUpBucket: "none" | "overdue" | "today" | "upcoming";
  noResponse: boolean;
  bookingId?: string;
  tripSlug?: string;
  pickupVariantName?: string;
  amountPaid?: number;
  remainingAmount?: number;
  notes?: string;
  createdAt: string;
}

interface TimelineEntry {
  id: string;
  type: string;
  message: string;
  actor?: string;
  createdAt: string;
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

export default function CrmLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<CrmLeadDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [followUpTime, setFollowUpTime] = useState("18:00"); // used by the Today/Tomorrow quick buttons; Custom picks its own time
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);
  const isExecutive = me?.role === "sales_executive";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/crm/leads/${params.id}`);
    const json = await res.json();
    if (json.success) {
      setLead(json.data.lead);
      setTimeline(json.data.timeline);
    } else {
      toast.error(json.error);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
    fetch("/api/admin/salespeople")
      .then((r) => r.json())
      .then((json) => json.success && setSalespeople(json.data));
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((json) => json.success && setMe(json.data));
  }, [load]);

  async function patch(body: Record<string, unknown>, successMsg?: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/crm/leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not update lead.");
        return;
      }
      if (successMsg) toast.success(successMsg);
      await load();
    } finally {
      setSaving(false);
    }
  }

  function scheduleFollowUp(when: "today" | "tomorrow") {
    const [h, m] = followUpTime.split(":").map(Number);
    const d = new Date();
    if (when === "tomorrow") d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
    patch({ nextFollowUpAt: d.toISOString() }, `Follow-up set for ${when === "today" ? "today" : "tomorrow"} at ${followUpTime}.`);
  }

  if (loading || !lead) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/crm")}>
          <ArrowLeft className="mr-1.5 size-4" /> Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{lead.name}</h1>
            <span className="font-mono text-xs text-muted-foreground">{lead.leadId}</span>
            {lead.noResponse ? (
              <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                <AlertTriangle className="mr-1 size-3" /> No Response &gt; 2 Days
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {lead.phone} · {CRM_LEAD_SOURCE_LABELS[lead.source as keyof typeof CRM_LEAD_SOURCE_LABELS] ?? lead.source}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">One-click status</Label>
                <StatusActionBar
                  status={lead.status}
                  disabled={saving}
                  onSetStatus={(s) => patch({ status: s }, `Status updated to ${CRM_LEAD_STATUS_LABELS[s]}.`)}
                  onClose={(reason) => patch({ status: "lost", lostReason: reason }, "Lead closed.")}
                />
                {lead.status === "lost" && lead.lostReason ? (
                  <p className="mt-2 text-xs text-muted-foreground">Lost reason: {lead.lostReason}</p>
                ) : null}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Assigned to</Label>
                <div className="mt-1">
                  {isExecutive ? (
                    <p className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                      {lead.assignedTo ?? "Unassigned"}{" "}
                      <span className="ml-2 text-xs">(only a Manager/Admin can reassign)</span>
                    </p>
                  ) : (
                    <LeadAssigneeSelect
                      value={lead.assignedTo}
                      onAssign={(name) => patch({ assignedTo: name }, name ? `Assigned to ${name}.` : "Unassigned.")}
                      salespeople={salespeople}
                      onSalespeopleChange={() =>
                        fetch("/api/admin/salespeople")
                          .then((r) => r.json())
                          .then((json) => json.success && setSalespeople(json.data))
                      }
                      disabled={saving}
                    />
                  )}
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Follow-up</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => scheduleFollowUp("today")} disabled={saving}>
                    Today
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => scheduleFollowUp("tomorrow")} disabled={saving}>
                    Tomorrow
                  </Button>
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    title="Time used by Today/Tomorrow"
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    disabled={saving}
                  />
                  <span className="text-xs text-muted-foreground">or custom:</span>
                  <input
                    type="datetime-local"
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    onChange={(e) => e.target.value && patch({ nextFollowUpAt: new Date(e.target.value).toISOString() }, "Follow-up scheduled.")}
                    disabled={saving}
                  />
                  {lead.nextFollowUpAt ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> Next: {formatDateTime(lead.nextFollowUpAt)}
                    </span>
                  ) : null}
                </div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                  {lead.phone}
                </a>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <a
                  href={`https://wa.me/${(lead.whatsappNumber ?? lead.phone).replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {lead.whatsappNumber ?? lead.phone}
                </a>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p>{lead.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pax</p>
                <p>{lead.paxCount ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trip Interest</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p>{lead.destination ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Travel timing</p>
                <p>{lead.travelTiming ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p>{lead.budget ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source & Campaign</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p>{CRM_LEAD_SOURCE_LABELS[lead.source as keyof typeof CRM_LEAD_SOURCE_LABELS] ?? lead.source}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Platform</p>
                <p>{lead.platform ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Campaign</p>
                <p>{lead.campaign ?? "—"}</p>
                {lead.campaignId ? <p className="font-mono text-xs text-muted-foreground">{lead.campaignId}</p> : null}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ad Set</p>
                <p>{lead.adSet ?? "—"}</p>
                {lead.adSetId ? <p className="font-mono text-xs text-muted-foreground">{lead.adSetId}</p> : null}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ad</p>
                <p>{lead.ad ?? "—"}</p>
                {lead.adId ? <p className="font-mono text-xs text-muted-foreground">{lead.adId}</p> : null}
              </div>
              {lead.metaLeadId ? (
                <div>
                  <p className="text-xs text-muted-foreground">Meta Lead ID</p>
                  <p className="font-mono text-xs">{lead.metaLeadId}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {lead.bookingId ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Booking Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Booking ID</p>
                  <p>{lead.bookingId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trip</p>
                  <p>{lead.tripSlug ?? "—"}</p>
                </div>
                {lead.pickupVariantName ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup Variant</p>
                    <p>{lead.pickupVariantName}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs text-muted-foreground">Amount paid</p>
                  <p>{lead.amountPaid ? `₹${lead.amountPaid.toLocaleString("en-IN")}` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Remaining amount</p>
                  <p>{lead.remainingAmount ? `₹${lead.remainingAmount.toLocaleString("en-IN")}` : "—"}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.notes ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{lead.notes}</p> : null}
              <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add a note…" rows={2} />
              <Button
                size="sm"
                disabled={!noteDraft.trim() || saving}
                onClick={async () => {
                  await patch({ note: noteDraft.trim() }, "Note added.");
                  setNoteDraft("");
                }}
              >
                Add Note
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ol className="space-y-4 border-l border-border pl-4">
                  {timeline.map((t) => (
                    <li key={t.id} className="relative">
                      <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary" />
                      <p className="text-sm">{t.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(t.createdAt)}
                        {t.actor ? ` · ${t.actor}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
