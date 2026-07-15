export interface Testimonial {
  id: string;
  name: string;
  trip: string;
  quote: string;
  rating: number;
}

/**
 * Placeholder voices until real reviews are wired to a data source. Kept
 * here rather than inline in the component per the site-wide rule: no
 * component holds literal copy that content/marketing would need to edit.
 */
export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Ananya R.",
    trip: "Rajasthan Royals",
    quote:
      "Went in not knowing a single person, came back with a friend group we still travel with every year.",
    rating: 5,
  },
  {
    id: "t2",
    name: "Kabir S.",
    trip: "Himalayan Winter Trail",
    quote:
      "Every detail was handled — I just had to show up. The themed touches made the whole trip feel considered.",
    rating: 5,
  },
  {
    id: "t3",
    name: "Meher P.",
    trip: "Goa Beach Reset",
    quote: "Best group energy of any trip I've booked. Would do it again in a heartbeat.",
    rating: 4.5,
  },
  {
    id: "t4",
    name: "Devika N.",
    trip: "Western Ghats Forest Trail",
    quote: "Small-group size meant we actually got to know the guides, not just each other.",
    rating: 5,
  },
];
