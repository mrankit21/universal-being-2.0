/**
 * Ticket HTML template (approved design). This is the single source of
 * truth for the e-ticket's visual design — `lib/pdf/ticket-pdf.ts` renders
 * this exact markup through headless Chrome to produce the PDF, so the
 * PDF is pixel-identical to this template every time.
 *
 * IMPORTANT: `destinationImage` here is per-booking — it's the hero photo
 * of the trip that was actually booked (fetched via the booking's
 * `tripSlug`), never a hardcoded example. `logoDataUri` is the one thing
 * that never changes between tickets: the Universal Being brand mark.
 */

export interface TicketHtmlData {
  logoDataUri: string;
  destinationImageDataUri: string | null; // null -> gradient fallback, never a placeholder photo
  destinationName: string; // e.g. "Udaipur" (booking.tripTitle's destination, not hardcoded)
  tripTagline: string; // trip.title, e.g. "Udaipur Flying Visit"
  heroCaption: string; // trip.shortDescription, trimmed
  bookingId: string;
  departureLabel: string; // pre-formatted date range
  travellerName: string;
  seats: number;
  emergencyContact: string | null;
  bookingStatusLabel: string;
  paymentStatusLabel: string;
  paymentStatusVariant: "paid" | "pending" | "refunded" | "failed";
  travellers: { name: string; age?: number }[];
  qrDataUri: string;
}

/** Minimal HTML-escaping — booking/traveller fields are user-entered and
 * get interpolated straight into markup that's rendered to a PDF. */
function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildTicketHtml(data: TicketHtmlData): string {
  const paymentPillClass = data.paymentStatusVariant === "paid" ? "paid" : "pending";

  const heroBg = data.destinationImageDataUri
    ? `<img class="hero-img" src="${data.destinationImageDataUri}" alt="${esc(data.destinationName)}">`
    : `<div class="hero-fallback"></div>`;

  const travellerRows = data.travellers.length
    ? data.travellers
        .map(
          (t) => `
        <div class="trav-row">
          <div class="av">${personIconSvg()}</div>
          <div class="info"><b>${esc(t.name)}${t.age ? `, ${esc(t.age)}y` : ""}</b></div>
        </div>`
        )
        .join("")
    : `<div class="trav-row"><div class="av">${personIconSvg()}</div><div class="info"><b>${esc(data.travellerName)}</b></div></div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Marcellus&family=Manrope:wght@400;500;600;700;800&display=swap');
  :root{ --navy:#0E2A4E; --navy-2:#173a68; --gold:#C7A254; --gold-light:#E8D5A3; --cream:#FAF7EE; --ink:#1B2333; --muted:#7C8496; }
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{ width:1120px; height:640px; font-family:'Manrope',sans-serif; background:var(--cream); }
  .ticket{ position:relative; width:1120px; height:640px; display:grid; grid-template-columns:1.5fr 0.95fr; overflow:hidden; outline:1px solid rgba(199,162,84,0.55); outline-offset:-1px; }
  .spine{ position:absolute; left:0; top:0; bottom:0; width:16px; background:linear-gradient(180deg,var(--navy),var(--navy-2)); z-index:6; }
  .notch{ position:absolute; width:32px; height:32px; border-radius:50%; top:50%; transform:translateY(-50%); z-index:8; background:#0d1a2e; }
  .notch.n-left{ left:-16px; }
  .notch.n-seam{ left:calc(61.2% - 16px); }
  .divider-line{ position:absolute; top:6%; bottom:6%; left:61.2%; border-left:2px dashed rgba(10,33,64,0.2); z-index:3; }
  .panel{ position:relative; padding:42px 34px 34px 50px; z-index:2; }
  .brandrow{ display:flex; align-items:center; gap:14px; margin-bottom:22px; }
  .logo-mark{ width:60px; height:60px; flex-shrink:0; object-fit:contain; }
  .brand-txt .name{ font-family:'Marcellus',serif; font-size:13px; letter-spacing:2.2px; color:var(--navy); text-transform:uppercase; }
  .brand-txt .tag{ font-size:9.5px; letter-spacing:1.8px; color:var(--gold); text-transform:uppercase; margin-top:2px; }
  .brandrow .eticket{ margin-left:auto; font-size:10.5px; letter-spacing:2px; color:var(--ink); text-transform:uppercase; font-weight:700; }
  .dest-name{ font-family:'Marcellus',serif; font-size:44px; color:var(--navy); line-height:1; margin-top:4px; }
  .dest-script{ font-family:'Cormorant Garamond',serif; font-style:italic; font-size:26px; color:var(--gold); margin-top:2px; }
  .title-divider{ display:flex; align-items:center; gap:10px; margin:14px 0 22px; }
  .title-divider .l{ flex:1; height:1px; background:rgba(199,162,84,0.4); }
  .title-divider svg{ width:14px; height:14px; }
  .fieldlist{ display:flex; flex-direction:column; }
  .field{ display:flex; gap:14px; align-items:center; padding:11px 0; border-bottom:1px solid rgba(10,33,64,0.08); }
  .field:last-child{ border-bottom:none; }
  .ficon{ width:34px; height:34px; border-radius:50%; background:var(--navy); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .ficon svg{ width:15px; height:15px; }
  .flabel{ font-size:9.5px; letter-spacing:1.6px; color:var(--gold); text-transform:uppercase; font-weight:700; margin-bottom:2px; }
  .fvalue{ font-size:15px; color:var(--ink); font-weight:600; }
  .field.status-field{ justify-content:space-between; }
  .status-field .fright{ margin-left:auto; }
  .pill{ font-size:10.5px; font-weight:700; letter-spacing:0.4px; padding:7px 15px; border-radius:8px; }
  .pill.slot{ background:var(--navy); color:var(--gold-light); }
  .pill.paid{ background:linear-gradient(135deg,var(--gold),#B08C3E); color:#241a06; }
  .pill.pending{ background:#E8E2D4; color:#7a6a3a; }
  .rightcol{ position:relative; z-index:2; padding:42px 34px 30px 30px; display:flex; flex-direction:column; height:100%; }
  .trav-card{ border-radius:16px; overflow:hidden; box-shadow:0 8px 22px -10px rgba(10,33,64,0.25); margin-bottom:22px; background:#fff; }
  .trav-head{ background:var(--navy); color:var(--gold-light); font-size:11px; letter-spacing:2.5px; text-transform:uppercase; font-weight:700; padding:11px 18px; }
  .trav-body{ padding:14px 18px; display:flex; flex-direction:column; gap:10px; max-height:130px; overflow:hidden; }
  .trav-row{ display:flex; align-items:center; gap:12px; }
  .trav-row .av{ width:28px; height:28px; border-radius:50%; background:var(--navy); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .trav-row .av svg{ width:13px; height:13px; }
  .trav-row .info b{ font-size:14px; color:var(--ink); font-weight:700; }
  .qr-divider{ display:flex; align-items:center; gap:10px; margin:4px 0 18px; }
  .qr-divider .l{ flex:1; height:0; border-top:2px dashed rgba(10,33,64,0.2); }
  .qr-divider svg{ width:14px; height:14px; }
  .qr-wrap{ text-align:center; margin-top:auto; }
  .qr-frame{ width:126px; height:126px; background:#fff; border-radius:14px; padding:9px; margin:0 auto 9px; box-shadow:0 10px 24px -10px rgba(10,33,64,0.3), 0 0 0 1px rgba(199,162,84,0.35); }
  .qr-frame img{ width:100%; height:100%; }
  .scan-caption{ font-size:11px; color:var(--muted); }
  .hero{ position:relative; grid-row:1/3; overflow:hidden; }
  .hero-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; clip-path:polygon(6% 0,100% 0,100% 100%,0 100%); }
  .hero-fallback{ position:absolute; inset:0; clip-path:polygon(6% 0,100% 0,100% 100%,0 100%); background:linear-gradient(135deg,var(--navy),var(--navy-2)); }
  .hero::after{ content:''; position:absolute; inset:0; clip-path:polygon(6% 0,100% 0,100% 100%,0 100%); background:linear-gradient(180deg, rgba(14,42,78,0) 45%, rgba(14,42,78,0.82) 100%); }
  .hero-stamp{ position:absolute; top:22px; right:22px; width:98px; height:98px; z-index:4; }
  .hero-caption{ position:absolute; bottom:22px; left:14%; right:22px; z-index:4; color:#fff; }
  .hero-caption .hc-eyebrow{ font-size:9px; letter-spacing:2.4px; text-transform:uppercase; font-weight:700; color:var(--gold-light); margin-bottom:4px; }
  .hero-caption .hc-main{ font-family:'Cormorant Garamond',serif; font-style:italic; font-size:17px; line-height:1.3; }
</style></head>
<body>
  <div class="ticket">
    <div class="spine"></div>
    <div class="notch n-left"></div>
    <div class="notch n-seam"></div>
    <div class="divider-line"></div>

    <div class="panel">
      <div class="brandrow">
        <img class="logo-mark" src="${data.logoDataUri}" alt="Universal Being"/>
        <div class="brand-txt">
          <div class="name">Universal Being</div>
          <div class="tag">Explore · Experience · Belong</div>
        </div>
        <div class="eticket">E-Ticket</div>
      </div>

      <div class="dest-name">${esc(data.destinationName)}</div>
      <div class="dest-script">${esc(data.tripTagline)}</div>
      <div class="title-divider"><div class="l"></div>${sparkSvg()}<div class="l"></div></div>

      <div class="fieldlist">
        <div class="field">
          <div class="ficon">${calendarIconSvg()}</div>
          <div><div class="flabel">Departure</div><div class="fvalue">${esc(data.departureLabel)}</div></div>
        </div>
        <div class="field">
          <div class="ficon">${personIconSvg()}</div>
          <div><div class="flabel">Traveller</div><div class="fvalue">${esc(data.travellerName)}</div></div>
        </div>
        <div class="field">
          <div class="ficon">${seatIconSvg()}</div>
          <div><div class="flabel">Seats</div><div class="fvalue">${esc(data.seats)}</div></div>
        </div>
        ${
          data.emergencyContact
            ? `<div class="field">
          <div class="ficon">${phoneIconSvg()}</div>
          <div><div class="flabel">Emergency Contact</div><div class="fvalue">${esc(data.emergencyContact)}</div></div>
        </div>`
            : ""
        }
        <div class="field status-field">
          <div class="ficon">${ticketIconSvg()}</div>
          <div><div class="flabel">Booking Status</div></div>
          <div class="fright"><span class="pill slot">${esc(data.bookingStatusLabel)}</span></div>
        </div>
        <div class="field status-field">
          <div class="ficon">${cardIconSvg()}</div>
          <div><div class="flabel">Payment Status</div></div>
          <div class="fright"><span class="pill ${paymentPillClass}">${esc(data.paymentStatusLabel)}</span></div>
        </div>
      </div>
    </div>

    <div class="rightcol">
      <div class="trav-card">
        <div class="trav-head">Travellers</div>
        <div class="trav-body">${travellerRows}</div>
      </div>

      <div class="qr-divider"><div class="l"></div>${sparkSvg()}<div class="l"></div></div>

      <div class="qr-wrap">
        <div class="qr-frame"><img src="${data.qrDataUri}" alt="QR"></div>
        <div class="scan-caption">Scan at departure</div>
      </div>
    </div>

    <div class="hero">
      ${heroBg}
      <svg class="hero-stamp" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#E8D5A3" stroke-width="1.1" opacity="0.85"/>
        <circle cx="50" cy="50" r="33" fill="none" stroke="#E8D5A3" stroke-width="1" opacity="0.6"/>
        <text x="50" y="25" fill="#E8D5A3" font-size="6.4" font-family="Manrope" letter-spacing="1.4" text-anchor="middle">JOURNEY TOGETHER</text>
        <text x="50" y="81" fill="#E8D5A3" font-size="6.4" font-family="Manrope" letter-spacing="1.4" text-anchor="middle">MEMORIES FOREVER</text>
        <path d="M50 42l2.6 8h8.4l-6.8 5 2.6 8-6.8-5-6.8 5 2.6-8-6.8-5h8.4z" fill="#E8D5A3"/>
      </svg>
      <div class="hero-caption">
        <div class="hc-eyebrow">Destination</div>
        <div class="hc-main">${esc(data.heroCaption)}</div>
      </div>
    </div>
  </div>
</body></html>`;
}

function personIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#E8D5A3" stroke-width="1.8"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>`;
}
function calendarIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#E8D5A3" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;
}
function seatIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#E8D5A3" stroke-width="1.8"><path d="M5 11V5a2 2 0 012-2h2a2 2 0 012 2v6M5 11h14v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6zM5 17l-1 4M19 17l1 4"/></svg>`;
}
function phoneIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#E8D5A3" stroke-width="1.8"><path d="M4 5c0 8.3 6.7 15 15 15l2-4-5-2-2 2c-2.5-1.2-4.3-3-5.5-5.5l2-2-2-5-4 1.5z"/></svg>`;
}
function ticketIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#E8D5A3" stroke-width="1.8"><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8z"/></svg>`;
}
function cardIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#E8D5A3" stroke-width="1.8"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`;
}
function sparkSvg() {
  return `<svg viewBox="0 0 24 24" fill="#C7A254"><path d="M12 2l1.4 5.6L19 9l-5.6 1.4L12 16l-1.4-5.6L5 9l5.6-1.4L12 2z"/></svg>`;
}
