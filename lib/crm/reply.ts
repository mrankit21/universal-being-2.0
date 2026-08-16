/**
 * Matches an inbound WhatsApp message to an existing lead (any source —
 * a Meta lead, a website enquiry, a manual entry — since a reply is a
 * reply regardless of how the lead first got created) and records it.
 * This is what makes `lastCustomerReplyAt` genuinely automatic per the
 * roadmap ("Automatic when integration supports it") instead of a
 * salesperson having to remember to log it.
 */
import { CrmLeadModel } from "@/lib/db/models/crm-lead.model";
import { logActivity } from "@/lib/crm/activity";
import { last10Digits } from "@/lib/crm/phone";

export async function findLeadByPhone(phone: string) {
  const suffix = last10Digits(phone);
  if (suffix.length < 10) return null;
  return CrmLeadModel.findOne({
    $or: [{ phone: { $regex: `${suffix}$` } }, { whatsappNumber: { $regex: `${suffix}$` } }],
  });
}

/** Updates `lastCustomerReplyAt`/`lastActivityAt` and logs a
 * `customer_replied` timeline entry — deliberately NOT a full call/
 * message log (one row per reply would violate the roadmap's "no
 * hundreds of call entries" rule if a customer sends many short
 * messages back to back), so this only touches the single "most recent
 * reply" timestamp rather than accumulating a row per message; the
 * timeline entry itself just says a reply came in, with a short preview,
 * not the full conversation. */
export async function recordCustomerReply(leadId: string, messagePreview: string, at: string) {
  await CrmLeadModel.updateOne(
    { leadId },
    { $set: { lastCustomerReplyAt: at, lastActivityAt: new Date().toISOString() } }
  );
  await logActivity({
    leadId,
    type: "customer_replied",
    message: `Customer replied on WhatsApp: "${messagePreview.slice(0, 120)}"`,
  });
}
