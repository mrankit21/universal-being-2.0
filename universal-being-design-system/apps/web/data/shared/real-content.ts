/**
 * Real content sourced from the Universal Being content package (About,
 * Contact, Policies). This is the ONE place these strings live — trip seed
 * data, legal pages, and the footer all import from here instead of
 * re-typing policy text, so a wording change happens in one file.
 *
 * Everything in this file is REAL brand copy, not placeholder.
 */

export const aboutContent = {
  tagline: "Explore • Experience • Belong",
  body: `Universal Being is a premium group travel community that brings together explorers, adventure seekers and like-minded travellers through carefully curated trips across India.

Our mission is to create unforgettable travel experiences by combining comfort, adventure, safety and meaningful connections. Every trip is planned with experienced trip leaders, quality stays and well-designed itineraries so that travellers can simply enjoy the journey.

At Universal Being, we believe travel is not just about visiting places—it's about creating memories, building friendships and experiencing every destination together.`,
};

export const contactContent = {
  companyName: "Universal Being",
  phone: "+91 93540 85668",
  whatsapp: "+91 93540 85668",
  alternateContact: "+91 83686 19732",
  officeAddress: "1st Floor, 105, Pocket 1, Sector 25, Rohini, Delhi – 110085",
  instagram: "https://instagram.com/universalbeing_07",
  email: "universalbeing.travel@gmail.com",
};

export const socialLinksContent = {
  instagram: "https://instagram.com/universalbeing_07",
};

/** Cancellation Policy — every trip's `cancellationPolicy` field defaults to
 * this unless a specific trip needs a documented exception. */
export const cancellationPolicyContent = `More than 30 days before departure: full refund after deducting any non-refundable booking expenses. 21–30 days before departure: 75% of the total trip cost is refunded. 11–20 days before departure: 50% of the total trip cost is refunded. 0–10 days before departure: no refund. Universal Being reserves the right to modify this policy when required.`;

export const refundPolicyContent = `Refunds are processed according to the cancellation policy. Approved refunds are initiated within 7–10 business days through the original payment method. Refund processing time may vary depending on the payment provider or bank. Booking amount and convenience charges may be non-refundable wherever applicable.`;

export const privacyPolicyContent = `Universal Being respects your privacy. We collect only the information required for trip bookings, communication and customer support. Personal information is never sold to third parties. Payment information is handled securely through authorized payment partners. By using our website, you agree to this privacy policy.`;

/** Terms & Conditions — every trip's `termsAndConditions` array defaults to
 * this unless a specific trip needs an addition. */
export const termsAndConditionsContent: string[] = [
  "Every traveller must carry a valid government ID.",
  "Illegal substances, weapons and fireworks are strictly prohibited.",
  "Travellers are responsible for any damage caused to hotel or transport property.",
  "Itinerary may change due to weather, road conditions or unforeseen circumstances.",
  "Universal Being is not responsible for delays caused by natural events or traffic.",
  "All travellers are expected to cooperate with the trip leader and maintain respectful behaviour throughout the trip.",
];
