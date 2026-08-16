/**
 * Website forms store WhatsApp numbers as bare 10 digits (no country
 * code — see trip2-lead.schema.ts / promo-lead.schema.ts), but WhatsApp
 * Cloud API's inbound webhook sends the full international `wa_id`
 * (e.g. "919876543210", no "+"). `last10Digits()` is the common ground
 * used to match "is this inbound WhatsApp message from someone who
 * already has a lead" regardless of which format created that lead.
 */
export function last10Digits(input: string): string {
  return input.replace(/\D/g, "").slice(-10);
}
