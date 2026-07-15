/** Icon keys resolved against the static registry in `value-props-section.tsx`
 * — same pattern as `NavIconKey` in types/layout.ts. */
export type ValuePropIconKey = "users" | "shield-check" | "sparkles" | "compass";

export interface ValueProp {
  icon: ValuePropIconKey;
  title: string;
  description: string;
}

export const valueProps: ValueProp[] = [
  {
    icon: "users",
    title: "Small, curated groups",
    description: "12–18 people per trip, matched by vibe — never a 40-seat bus of strangers.",
  },
  {
    icon: "sparkles",
    title: "Themed to the destination",
    description: "Every trip's mood, palette, and pace is designed around where you're actually going.",
  },
  {
    icon: "shield-check",
    title: "Handled end to end",
    description: "Stays, transport, permits, and a trip lead on the ground — you just show up.",
  },
  {
    icon: "compass",
    title: "Built by frequent travelers",
    description: "Every itinerary is run by the team first — no route ships without being lived in.",
  },
];
