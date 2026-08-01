/**
 * Shared building blocks for transactional email HTML (Step 8C, Part 9
 * follow-up). `lib/notifications/dispatch.ts` composes every notification
 * from these instead of hand-rolling markup per event, so a palette or
 * copy tweak is a one-file change and all six-plus emails stay visually
 * consistent.
 *
 * Deliberately table-based with every style inline and no remote fonts —
 * that's what actually survives Gmail/Outlook/mobile-mail stripping,
 * unlike the `<style>`-in-`<head>` + web-font approach the rest of the app
 * uses. Colors are the same tokens as `app/globals.css` (`--ub-color-*`),
 * copied here rather than imported because they're CSS custom properties,
 * not a JS-importable module.
 */
import { contactContent } from "@/data/shared/real-content";

export const EMAIL_COLORS = {
  ink: "#15130f",
  cream: "#f7f6f3",
  card: "#eeece5",
  border: "#ded9cd",
  stone: "#635c49",
  stoneLight: "#a49c86",
  brass: "#b0873f",
  brassDark: "#8e6b2e",
  teal: "#1f433f",
} as const;

/** Minimal HTML-escaping — booking/customer fields are user-entered and
 * get interpolated straight into email markup. */
export function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** `en-IN`, "12 Aug 2026" style — same options as `lib/pdf/ticket-pdf.ts`'s
 * `formatDepartureLabel` so the date on the e-ticket PDF and the date in
 * the email that links to it always read identically. */
export function formatEmailDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatEmailDateRange(startIso?: string, endIso?: string): string | null {
  const start = formatEmailDate(startIso);
  if (!start) return null;
  const end = formatEmailDate(endIso);
  return end && end !== start ? `${start} – ${end}` : start;
}

/** Includes the time — used for reservation-expiry deadlines, where "the
 * 12th" isn't enough, the customer needs the cutoff hour too. */
export function formatEmailDateTime(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export interface EmailDetailRow {
  label: string;
  value: string;
}

/** The bordered key/value block every email uses for "Trip / Dates /
 * Travellers / Amount" — skip a row entirely by omitting it from `rows`
 * rather than passing an empty value, so callers don't need `if` chains
 * inline in their template strings. */
export function detailsCard(rows: EmailDetailRow[]): string {
  const rowsHtml = rows
    .map(
      (r, i) => `
      <tr>
        <td style="padding:10px 2px; border-top:${i === 0 ? "none" : `1px solid ${EMAIL_COLORS.border}`}; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:${EMAIL_COLORS.stone}; width:44%; vertical-align:top;">${esc(r.label)}</td>
        <td style="padding:10px 2px; border-top:${i === 0 ? "none" : `1px solid ${EMAIL_COLORS.border}`}; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:${EMAIL_COLORS.ink}; font-weight:700; text-align:right; vertical-align:top;">${esc(r.value)}</td>
      </tr>`
    )
    .join("");
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_COLORS.card}; border:1px solid ${EMAIL_COLORS.border}; border-radius:10px; margin:22px 0;">
    <tr><td style="padding:6px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
    </td></tr>
  </table>`;
}

export function ctaButton(label: string, url: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;">
    <tr>
      <td style="border-radius:8px; background:${EMAIL_COLORS.brass};">
        <a href="${url}" style="display:inline-block; padding:13px 26px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:700; letter-spacing:0.2px; color:${EMAIL_COLORS.ink}; text-decoration:none; border-radius:8px;">${esc(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 14px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.65; color:${EMAIL_COLORS.ink};">${html}</p>`;
}

/** A dimmer, smaller paragraph — footnotes, fine print, "if you didn't
 * request this" disclaimers. */
export function note(html: string): string {
  return `<p style="margin:6px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:12.5px; line-height:1.6; color:${EMAIL_COLORS.stone};">${html}</p>`;
}

export interface EmailLayoutOptions {
  /** Shown by mail clients in the inbox list before the email is opened;
   * hidden in the rendered body itself. */
  previewText: string;
  /** Small uppercase label above the heading, e.g. "PAYMENT RECEIVED". */
  eyebrow: string;
  heading: string;
  /** Pre-built inner content — paragraph()/detailsCard()/ctaButton() calls
   * joined together. */
  bodyHtml: string;
}

export function emailLayout(opts: EmailLayoutOptions): string {
  const c = EMAIL_COLORS;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(opts.heading)}</title>
</head>
<body style="margin:0; padding:0; background:${c.cream};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${esc(opts.previewText)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.cream}; padding:32px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid ${c.border};">
          <tr>
            <td style="background:${c.ink}; padding:26px 32px; text-align:center;">
              <span style="font-family:Georgia,'Times New Roman',serif; font-size:19px; letter-spacing:3px; color:${c.brass}; text-transform:uppercase;">Universal Being</span>
              <div style="height:2px; width:46px; background:${c.brass}; margin:12px auto 0;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 4px;">
              <p style="margin:0 0 8px; font-family:Arial,Helvetica,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${c.brassDark}; font-weight:700;">${esc(opts.eyebrow)}</p>
              <h1 style="margin:0 0 16px; font-family:Georgia,'Times New Roman',serif; font-size:23px; line-height:1.35; color:${c.ink}; font-weight:normal;">${esc(opts.heading)}</h1>
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 36px 32px;">
              <div style="border-top:1px solid ${c.border}; padding-top:20px; font-family:Arial,Helvetica,sans-serif; font-size:12.5px; line-height:1.7; color:${c.stone};">
                <p style="margin:0 0 4px; font-weight:700; color:${c.ink};">${esc(contactContent.companyName)}</p>
                <p style="margin:0 0 4px;">${esc(contactContent.officeAddress)}</p>
                <p style="margin:0;">
                  <a href="tel:${contactContent.phone.replace(/\s/g, "")}" style="color:${c.teal}; text-decoration:none;">${esc(contactContent.phone)}</a>
                  &nbsp;&middot;&nbsp;
                  <a href="mailto:${contactContent.email}" style="color:${c.teal}; text-decoration:none;">${esc(contactContent.email)}</a>
                </p>
                <p style="margin:14px 0 0; color:${c.stoneLight};">This is a transactional email about your booking with Universal Being.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
