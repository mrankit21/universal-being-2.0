/**
 * Invoice HTML template — same brand theme as lib/pdf/ticket-html.ts
 * (navy/gold/cream, Marcellus + Manrope + Cormorant Garamond). Kept to
 * ONE page, A4 portrait, and deliberately not repeating anything the
 * e-ticket already covers in detail (traveller list, QR, emergency
 * contact) — this is the payment/billing document, not a second ticket.
 */

export interface InvoiceHtmlRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface InvoiceHtmlData {
  logoDataUri: string;
  legalBusinessName: string;
  registeredAddress: string;
  gstin: string;
  udyamNumber: string;
  msmeUan: string;
  phone: string;
  email: string;
  website: string;
  invoiceNumber: string;
  issuedDateLabel: string;
  statusLabel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tripTitle: string;
  departureLabel: string; // pre-formatted, "" if unknown
  travellersLabel: string; // e.g. "3 travellers"
  rows: InvoiceHtmlRow[];
  signatoryName: string;
}

function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const INVOICE_WIDTH = 794; // A4 @ 96dpi
export const INVOICE_HEIGHT = 1123;

export function buildInvoiceHtml(data: InvoiceHtmlData): string {
  const metaLine = [data.registeredAddress, data.phone, data.email, data.website].filter(Boolean).join("  ·  ");
  const regLine = [
    data.gstin ? `GSTIN: ${esc(data.gstin)}` : "",
    data.udyamNumber ? `UDYAM: ${esc(data.udyamNumber)}` : "",
    data.msmeUan ? `MSME UAN: ${esc(data.msmeUan)}` : "",
  ]
    .filter(Boolean)
    .join("   ");

  const rowsHtml = data.rows
    .map(
      (r) => `
      <div class="row${r.emphasis ? " emphasis" : ""}">
        <div class="rlabel">${esc(r.label)}</div>
        <div class="rvalue">${esc(r.value)}</div>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Marcellus&family=Manrope:wght@400;500;600;700;800&display=swap');
  :root{ --navy:#0E2A4E; --navy-2:#173a68; --gold:#C7A254; --gold-light:#E8D5A3; --cream:#FAF7EE; --ink:#1B2333; --muted:#7C8496; }
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{ width:${INVOICE_WIDTH}px; font-family:'Manrope',sans-serif; background:var(--cream); color:var(--ink); }
  .sheet{ width:${INVOICE_WIDTH}px; min-height:${INVOICE_HEIGHT}px; padding:44px 50px; position:relative; }
  .topband{ position:absolute; top:0; left:0; right:0; height:10px; background:linear-gradient(90deg,var(--navy),var(--gold)); }
  .header{ display:flex; align-items:flex-start; justify-content:space-between; margin-top:14px; margin-bottom:6px; }
  .brand{ display:flex; align-items:center; gap:14px; }
  .logo-mark{ width:54px; height:54px; object-fit:contain; }
  .brand-name{ font-family:'Marcellus',serif; font-size:22px; color:var(--navy); letter-spacing:0.5px; }
  .brand-tag{ font-size:9.5px; letter-spacing:1.8px; color:var(--gold); text-transform:uppercase; margin-top:2px; }
  .doc-badge{ text-align:right; }
  .doc-badge .kicker{ font-size:10px; letter-spacing:2.5px; color:var(--gold); text-transform:uppercase; font-weight:700; }
  .doc-badge .num{ font-family:'Marcellus',serif; font-size:19px; color:var(--navy); margin-top:2px; }
  .meta-line{ font-size:9.5px; color:var(--muted); margin-top:14px; line-height:1.5; }
  .reg-line{ font-size:9px; color:var(--muted); margin-top:2px; letter-spacing:0.2px; }
  .hr{ height:1px; background:rgba(199,162,84,0.4); margin:20px 0; }
  .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:22px; }
  .card{ background:#fff; border-radius:12px; box-shadow:0 6px 16px -10px rgba(10,33,64,0.18); overflow:hidden; }
  .card-head{ background:var(--navy); color:var(--gold-light); font-size:10px; letter-spacing:2px; text-transform:uppercase; font-weight:700; padding:9px 16px; }
  .card-body{ padding:13px 16px; font-size:12.5px; line-height:1.7; }
  .card-body b{ color:var(--navy); }
  .status-pill{ display:inline-block; font-size:9.5px; font-weight:700; letter-spacing:0.5px; padding:4px 11px; border-radius:7px; background:var(--gold-light); color:#6b5420; text-transform:uppercase; margin-top:4px; }
  .table-card{ background:#fff; border-radius:12px; box-shadow:0 6px 16px -10px rgba(10,33,64,0.18); overflow:hidden; margin-bottom:24px; }
  .row{ display:flex; align-items:center; justify-content:space-between; padding:11px 18px; border-bottom:1px solid rgba(10,33,64,0.07); font-size:13px; }
  .row:last-child{ border-bottom:none; }
  .row.emphasis{ background:var(--cream); }
  .row.emphasis .rlabel, .row.emphasis .rvalue{ font-weight:800; color:var(--navy); font-size:14.5px; }
  .rlabel{ color:var(--muted); }
  .rvalue{ font-weight:700; color:var(--ink); }
  .footer{ display:flex; justify-content:space-between; align-items:flex-end; margin-top:36px; }
  .thanks{ font-family:'Cormorant Garamond',serif; font-style:italic; font-size:15px; color:var(--navy); }
  .thanks .small{ font-family:'Manrope',sans-serif; font-style:normal; font-size:9.5px; letter-spacing:1.6px; color:var(--muted); text-transform:uppercase; margin-top:2px; }
  .sign{ text-align:right; }
  .sign .for{ font-size:9.5px; color:var(--muted); }
  .sign .name{ font-family:'Cormorant Garamond',serif; font-style:italic; font-size:17px; color:var(--navy); margin-top:14px; }
  .sign .role{ font-size:9px; color:var(--muted); margin-top:2px; }
  .note{ margin-top:26px; font-size:8.5px; color:var(--muted); text-align:center; letter-spacing:0.3px; }
</style></head>
<body>
  <div class="sheet">
    <div class="topband"></div>

    <div class="header">
      <div class="brand">
        <img class="logo-mark" src="${data.logoDataUri}" alt="Universal Being"/>
        <div>
          <div class="brand-name">${esc(data.legalBusinessName)}</div>
          <div class="brand-tag">Explore · Experience · Belong</div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="kicker">Tax Invoice</div>
        <div class="num">${esc(data.invoiceNumber)}</div>
      </div>
    </div>

    ${metaLine ? `<div class="meta-line">${metaLine}</div>` : ""}
    ${regLine ? `<div class="reg-line">${regLine}</div>` : ""}

    <div class="hr"></div>

    <div class="grid2">
      <div class="card">
        <div class="card-head">Billed To</div>
        <div class="card-body">
          <b>${esc(data.customerName)}</b><br/>
          ${esc(data.customerEmail)}${data.customerPhone ? `<br/>${esc(data.customerPhone)}` : ""}
        </div>
      </div>
      <div class="card">
        <div class="card-head">Invoice Details</div>
        <div class="card-body">
          Date: <b>${esc(data.issuedDateLabel)}</b><br/>
          Trip: <b>${esc(data.tripTitle)}</b>${data.departureLabel ? `<br/>Departure: <b>${esc(data.departureLabel)}</b>` : ""}<br/>
          ${esc(data.travellersLabel)}
          <div class="status-pill">${esc(data.statusLabel)}</div>
        </div>
      </div>
    </div>

    <div class="table-card">
      ${rowsHtml}
    </div>

    <div class="footer">
      <div class="thanks">
        Thank you for choosing Universal Being
        <div class="small">Journey Together · Memories Forever</div>
      </div>
      ${
        data.signatoryName
          ? `<div class="sign">
        <div class="for">For ${esc(data.legalBusinessName)}</div>
        <div class="name">${esc(data.signatoryName)}</div>
        <div class="role">Authorised Signatory</div>
      </div>`
          : ""
      }
    </div>

    <div class="note">This is a system-generated invoice and does not require a physical signature.</div>
  </div>
</body></html>`;
}
