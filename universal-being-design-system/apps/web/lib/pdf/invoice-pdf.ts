/**
 * Invoice PDF (Step 8C, Part 7). Built with `pdf-lib` — pure JS, no native
 * bindings and no filesystem font loading required (uses PDF's built-in
 * Helvetica), so it runs unmodified in any Node.js serverless runtime.
 * Deliberately simple/utilitarian layout: this is a generated financial
 * document, not a marketing asset — clarity over decoration.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { InvoiceDocument } from "@/lib/db/models/invoice.model";
import { getGstConfig } from "@/lib/config/payment-config";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export async function generateInvoicePdf(invoice: InvoiceDocument): Promise<Buffer> {
  const gst = getGstConfig();
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const left = 50;
  const draw = (text: string, opts: { x?: number; size?: number; f?: typeof font; color?: [number, number, number] } = {}) => {
    page.drawText(text, {
      x: opts.x ?? left,
      y,
      size: opts.size ?? 10,
      font: opts.f ?? font,
      color: rgb(...(opts.color ?? [0.1, 0.1, 0.1])),
    });
  };
  const gap = (n = 16) => (y -= n);

  draw(gst.legalBusinessName, { size: 18, f: bold });
  gap(20);
  if (gst.registeredAddress) {
    draw(gst.registeredAddress, { size: 9, color: [0.4, 0.4, 0.4] });
    gap(14);
  }
  if (gst.gstin) {
    draw(`GSTIN: ${gst.gstin}`, { size: 9, color: [0.4, 0.4, 0.4] });
    gap(14);
  }

  gap(10);
  draw(`INVOICE ${invoice.invoiceNumber}`, { size: 14, f: bold });
  gap(18);
  draw(`Issued: ${new Date(invoice.issuedAt).toLocaleDateString("en-IN")}`);
  gap(14);
  draw(`Status: ${invoice.status.toUpperCase()}`);
  gap(24);

  draw("Bill To", { f: bold });
  gap(14);
  draw(invoice.customerName);
  gap(14);
  draw(invoice.customerEmail);
  gap(14);
  if (invoice.customerPhone) {
    draw(invoice.customerPhone);
    gap(14);
  }
  gap(10);

  draw("Trip Details", { f: bold });
  gap(14);
  draw(invoice.tripTitle);
  gap(14);
  if (invoice.departureStartDate) {
    draw(
      `Departure: ${new Date(invoice.departureStartDate).toLocaleDateString("en-IN")}` +
        (invoice.departureEndDate ? ` – ${new Date(invoice.departureEndDate).toLocaleDateString("en-IN")}` : "")
    );
    gap(14);
  }
  draw(`Travellers: ${invoice.seatsBooked}`);
  gap(24);

  // Line-item table (single line item — trip package — kept simple; a
  // multi-line breakdown can be added later without touching the layout
  // scaffolding above).
  const rows: [string, string][] = [
    ["Subtotal", money(invoice.subtotal, invoice.currency)],
    ["Discount", `- ${money(invoice.discountAmount, invoice.currency)}`],
  ];
  if (invoice.gstRatePercent > 0) {
    rows.push([`GST (${invoice.gstRatePercent}%)`, money(invoice.gstAmount, invoice.currency)]);
  }
  rows.push(["Total", money(invoice.totalAmount, invoice.currency)]);
  rows.push(["Amount Paid", money(invoice.amountPaid, invoice.currency)]);
  rows.push(["Balance Due", money(invoice.balanceDue, invoice.currency)]);

  for (const [label, value] of rows) {
    const isTotal = label === "Total" || label === "Balance Due";
    draw(label, { f: isTotal ? bold : font });
    draw(value, { x: 400, f: isTotal ? bold : font });
    gap(16);
  }

  gap(20);
  draw("This is a system-generated invoice.", { size: 8, color: [0.5, 0.5, 0.5] });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
