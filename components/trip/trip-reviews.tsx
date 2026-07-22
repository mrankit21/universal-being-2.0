import type { Trip } from "@/types/trip";
import type { Testimonial } from "@/data/home/testimonials";
import { themeRegistry } from "@/data/themes";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Rating } from "@/components/primitives/rating";
import { TripImage } from "@/components/trip/trip-image";

export interface TripReviewsProps {
  trip: Trip;
  /** Reviews assigned from the Testimonials collection (Step 7.6D §9),
   * resolved server-side via `getTripReviewTestimonials`. Optional so this
   * component still works wherever a Trip is rendered without that lookup. */
  assignedReviews?: Testimonial[];
}

/** TripReviews — Step 7.6C-A §12 + Step 7.6D §9. Renders the trip's own
 * admin-managed review list: assigned Testimonials first (the current,
 * de-duplicated source of truth), followed by any legacy embedded reviews
 * kept for backward compatibility. Self-hides when both are empty, same
 * pattern as every other optional section on the Trip Details page. */
export function TripReviews({ trip, assignedReviews = [] }: TripReviewsProps) {
  if (trip.reviews.length === 0 && assignedReviews.length === 0) return null;
  const theme = themeRegistry[trip.themeKey];

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="What travellers say" className="mb-5" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {assignedReviews.map((t) => (
          <div key={t.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
            <p className="font-medium text-foreground">{t.name || "Traveller"}</p>
            <Rating value={t.rating} size="sm" showValue={false} />
            <p className="text-sm text-muted-foreground">{t.quote}</p>
          </div>
        ))}
        {trip.reviews.map((review) => (
          <div key={review.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <TripImage
                asset={review.customerPhoto}
                theme={theme}
                variant="thumbnail"
                containerClassName="size-12 shrink-0 rounded-full"
              />
              <div>
                <p className="font-medium text-foreground">{review.customerName || "Traveller"}</p>
                {review.reviewDate ? (
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.reviewDate).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}
                  </p>
                ) : null}
              </div>
            </div>
            <Rating value={review.rating} size="sm" showValue={false} />
            <p className="text-sm text-muted-foreground">{review.reviewText}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
