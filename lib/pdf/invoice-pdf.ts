/**
 * Invoice PDF — HTML-rendered (replaces the pdf-lib drawText version, kept
 * at lib/pdf/invoice-pdf-legacy.ts for reference), matching the e-ticket's
 * navy/gold/cream brand theme (lib/pdf/ticket-html.ts). Deliberately does
 * NOT repeat what the e-ticket already shows in detail (traveller list,
 * QR, emergency contact) — this is the billing document.
 */
import type { InvoiceDocument } from "@/lib/db/models/invoice.model";
import { getGstConfig, getBusinessInfo } from "@/lib/config/payment-config";
import { buildInvoiceHtml, type InvoiceHtmlRow } from "./invoice-html";
import { renderHtmlToPdf } from "./render-html-to-pdf";
import { localImageToDataUri } from "./asset-utils";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  }).format(amount);
}

const STATUS_LABELS: Record<string, string> = {
  issued: "ISSUED",
  cancelled: "CANCELLED",
};

export async function generateInvoicePdf(invoice: InvoiceDocument): Promise<Buffer> {
  const gst = getGstConfig();
  const business = getBusinessInfo();
  const logoDataUri = await localImageToDataUri("brand/logo.png");

  const departureLabel = invoice.departureStartDate
    ? `${new Date(invoice.departureStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` +
      (invoice.departureEndDate
        ? ` – ${new Date(invoice.departureEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        : "")
    : "";

  const rows: InvoiceHtmlRow[] = [{ label: "Subtotal", value: money(invoice.subtotal, invoice.currency) }];
  if (invoice.discountAmount > 0) {
    rows.push({ label: "Discount", value: `- ${money(invoice.discountAmount, invoice.currency)}` });
  }
  if (invoice.gstRatePercent > 0) {
    rows.push({ label: `GST (${invoice.gstRatePercent}%)`, value: money(invoice.gstAmount, invoice.currency) });
  }
  rows.push({ label: "Total Amount", value: money(invoice.totalAmount, invoice.currency), emphasis: true });
  rows.push({ label: "Amount Paid", value: money(invoice.amountPaid, invoice.currency) });
  rows.push({ label: "Balance Due", value: money(invoice.balanceDue, invoice.currency), emphasis: invoice.balanceDue > 0 });

  const html = buildInvoiceHtml({
    logoDataUri,
    legalBusinessName: gst.legalBusinessName,
    registeredAddress: gst.registeredAddress,
    gstin: invoice.gstin || gst.gstin,
    udyamNumber: business.udyamNumber,
    msmeUan: business.msmeUan,
    phone: business.phone,
    email: business.email,
    website: business.website,
    invoiceNumber: invoice.invoiceNumber,
    issuedDateLabel: new Date(invoice.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    statusLabel: STATUS_LABELS[invoice.status] ?? invoice.status.toUpperCase(),
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    customerPhone: invoice.customerPhone || "",
    tripTitle: invoice.tripTitle,
    departureLabel,
    travellersLabel: `${invoice.seatsBooked} ${invoice.seatsBooked === 1 ? "traveller" : "travellers"}`,
    rows,
    signatoryName: business.signatoryName,
  });

  return renderHtmlToPdf(html, { format: "A4" });
}
