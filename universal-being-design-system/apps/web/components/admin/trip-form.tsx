"use client";

/**
 * TripForm — the single reusable create/edit form for Trip Management
 * (requirement #3's full checklist: pricing, batch dates, seats, gallery,
 * itinerary, FAQs, policies, Google Maps — all as tabs of ONE form/document,
 * matching Architecture §7's TripEditor).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FormField } from "./form-field";
import { ImageAssetField } from "./image-asset-field";
import { StringListEditor } from "./string-list-editor";
import { ArrayFieldEditor } from "./array-field-editor";
import { TestimonialPickerField } from "./testimonial-picker-field";
import type { Trip, DayPlan, DepartureDate, Faq, AccommodationEntry, TripReview } from "@/types/trip";
import type { ThemeKey } from "@/types/theme";

const THEME_KEYS: ThemeKey[] = ["brand", "rajasthan", "winter", "monsoon", "beach", "mountain", "forest"];

const emptyImage = () => ({
  provider: "placeholder" as const,
  url: "",
  alt: "",
  width: 1600,
  height: 900,
  isPlaceholder: true,
});

type TripFormValue = Omit<Trip, "id" | "createdAt" | "updatedAt">;

function blank(): TripFormValue {
  return {
    slug: "",
    title: "",
    destinationSlug: "",
    destinationName: "",
    themeKey: "brand",
    shortDescription: "",
    fullDescription: "",
    heroImage: emptyImage(),
    coverImage: emptyImage(),
    thumbnail: emptyImage(),
    homepageHeroImage: emptyImage(),
    gallery: [],
    duration: { days: 1, nights: 0, label: "" },
    difficulty: "easy",
    bestSeason: [],
    bestTimeToVisit: "",
    altitude: "",
    groupSize: { min: 2, max: 12 },
    pickup: "",
    drop: "",
    startingCity: "",
    endingCity: "",
    vehicle: "",
    travelNotes: "",
    accommodation: [],
    mealPlan: { breakfast: false, lunch: false, dinner: false, snacks: false, description: "" },
    price: { base: 0, bookingAmount: 0, currency: "INR" },
    totalSeats: 0,
    availableSeats: 0,
    departureDates: [],
    inclusions: [],
    exclusions: [],
    highlights: [],
    itinerary: [],
    faqs: [],
    reviews: [],
    reviewIds: [],
    termsAndConditions: [],
    cancellationPolicy: "",
    mapQuery: "",
    rating: 0,
    reviewCount: 0,
    featured: false,
    status: "draft",
    seo: { title: "", description: "", keywords: [] },
    isPlaceholderContent: true,
  };
}

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;

/** Backfills fields added after some Trips were already saved (itinerary/
 * accommodation `images`, `seo.keywords`) so older documents still load
 * without crashing the form — same graceful-fallback rule the rest of the
 * project follows for partial content. */
function normalize(v: TripFormValue): TripFormValue {
  return {
    ...v,
    itinerary: v.itinerary.map((day) => ({ ...day, images: day.images ?? [] })),
    accommodation: v.accommodation.map((hotel) => ({ ...hotel, images: hotel.images ?? [], amenities: hotel.amenities ?? [] })),
    mealPlan: { ...v.mealPlan, snacks: v.mealPlan.snacks ?? false },
    reviewIds: v.reviewIds ?? [],
    seo: { ...v.seo, keywords: v.seo.keywords ?? [] },
    departureDates: v.departureDates.map((batch) => ({ ...batch, isPublished: batch.isPublished ?? true })),
  };
}

export function TripForm({ tripId, initialValue }: { tripId?: string; initialValue?: TripFormValue }) {
  const router = useRouter();
  const [value, setValue] = useState<TripFormValue>(initialValue ? normalize(initialValue) : blank());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  function set<K extends keyof TripFormValue>(key: K, val: TripFormValue[K]) {
    setValue((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors(null);
    try {
      const url = tripId ? `/api/admin/trips/${tripId}` : "/api/admin/trips";
      const method = tripId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const json = await res.json();
      if (!json.success) {
        if (json.details?.fieldErrors) setErrors(json.details.fieldErrors);
        toast.error(json.error ?? "Something went wrong");
        return;
      }
      toast.success(tripId ? "Trip updated" : "Trip created");
      router.push("/admin/trips");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <FormField label="" className="flex flex-row items-center gap-2 space-y-0">
            <Switch checked={value.featured} onCheckedChange={(v) => set("featured", v)} id="featured" />
          </FormField>
          <label htmlFor="featured" className="text-sm font-medium">Featured trip</label>
        </div>
        <Select value={value.status} onValueChange={(v) => set("status", v as TripFormValue["status"])}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="basic">
        <TabsList className="flex-wrap">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Batches</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
          <TabsTrigger value="inclusions">Inclusions</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="map">Map & SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <FormField label="Title" error={errors?.title?.[0]}>
                <Input value={value.title} onChange={(e) => set("title", e.target.value)} required />
              </FormField>
              <FormField label="Slug" error={errors?.slug?.[0]}>
                <Input value={value.slug} onChange={(e) => set("slug", e.target.value)} required />
              </FormField>
              <FormField label="Destination Slug" hint="Must match an existing Destination's slug">
                <Input value={value.destinationSlug} onChange={(e) => set("destinationSlug", e.target.value)} required />
              </FormField>
              <FormField label="Destination Name">
                <Input value={value.destinationName} onChange={(e) => set("destinationName", e.target.value)} required />
              </FormField>
              <FormField label="Theme">
                <Select value={value.themeKey} onValueChange={(v) => set("themeKey", v as ThemeKey)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {THEME_KEYS.map((key) => <SelectItem key={key} value={key} className="capitalize">{key}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Difficulty">
                <Select value={value.difficulty} onValueChange={(v) => set("difficulty", v as TripFormValue["difficulty"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="challenging">Challenging</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Days">
                <Input type="number" min={1} value={value.duration.days} onChange={(e) => set("duration", { ...value.duration, days: Number(e.target.value) })} />
              </FormField>
              <FormField label="Nights">
                <Input type="number" min={0} value={value.duration.nights} onChange={(e) => set("duration", { ...value.duration, nights: Number(e.target.value) })} />
              </FormField>
              <FormField label="Duration Label" className="md:col-span-2">
                <Input value={value.duration.label} onChange={(e) => set("duration", { ...value.duration, label: e.target.value })} placeholder="e.g. 5 Days / 4 Nights" />
              </FormField>
              <FormField label="Group Size Min">
                <Input type="number" min={1} value={value.groupSize.min} onChange={(e) => set("groupSize", { ...value.groupSize, min: Number(e.target.value) })} />
              </FormField>
              <FormField label="Group Size Max">
                <Input type="number" min={1} value={value.groupSize.max} onChange={(e) => set("groupSize", { ...value.groupSize, max: Number(e.target.value) })} />
              </FormField>
              <FormField label="Best Time" hint="Optional — single line shown on the Trip Highlights strip, e.g. 'Oct – Feb'">
                <Input value={value.bestTimeToVisit ?? ""} onChange={(e) => set("bestTimeToVisit", e.target.value)} />
              </FormField>
              <FormField label="Altitude" hint="Optional — e.g. '13,050 ft'">
                <Input value={value.altitude ?? ""} onChange={(e) => set("altitude", e.target.value)} />
              </FormField>
              <FormField label="Starting City" hint="Optional">
                <Input value={value.startingCity ?? ""} onChange={(e) => set("startingCity", e.target.value)} />
              </FormField>
              <FormField label="Ending City" hint="Optional">
                <Input value={value.endingCity ?? ""} onChange={(e) => set("endingCity", e.target.value)} />
              </FormField>
              <FormField label="Short Description" className="md:col-span-2">
                <Textarea rows={2} value={value.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
              </FormField>
              <FormField label="Full Description" className="md:col-span-2">
                <Textarea rows={6} value={value.fullDescription} onChange={(e) => set("fullDescription", e.target.value)} />
              </FormField>
              <FormField label="Best Season" className="md:col-span-2">
                <StringListEditor items={value.bestSeason} onChange={(v) => set("bestSeason", v)} placeholder="e.g. March–June" />
              </FormField>
              <FormField label="Highlights" className="md:col-span-2">
                <StringListEditor items={value.highlights} onChange={(v) => set("highlights", v)} placeholder="e.g. Sunrise at Chandratal" />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField label="Base Price (₹)">
                <Input type="number" min={0} value={value.price.base} onChange={(e) => set("price", { ...value.price, base: Number(e.target.value) })} />
              </FormField>
              <FormField label="Discounted Price (₹)" hint="Optional — leave blank if not discounted">
                <Input type="number" min={0} value={value.price.discounted ?? ""} onChange={(e) => set("price", { ...value.price, discounted: e.target.value ? Number(e.target.value) : undefined })} />
              </FormField>
              <FormField label="Discount" hint="Auto-calculated from Base and Discounted Price">
                <Input
                  readOnly
                  disabled
                  value={
                    value.price.discounted && value.price.base > 0
                      ? `${Math.round((1 - value.price.discounted / value.price.base) * 100)}% off`
                      : "No discount"
                  }
                />
              </FormField>
              <FormField label="Book Your Slot Amount (₹)" hint="Advance/deposit amount required to reserve a seat on this trip. Booking and payment automatically use this value — set independently per trip.">
                <Input type="number" min={0} value={value.price.bookingAmount} onChange={(e) => set("price", { ...value.price, bookingAmount: Number(e.target.value) })} />
              </FormField>
              <FormField label="Currency">
                <Input value={value.price.currency} onChange={(e) => set("price", { ...value.price, currency: e.target.value })} />
              </FormField>
              <FormField label="Total Seats (across all batches)">
                <Input type="number" min={0} value={value.totalSeats} onChange={(e) => set("totalSeats", Number(e.target.value))} />
              </FormField>
              <FormField label="Available Seats">
                <Input type="number" min={0} value={value.availableSeats} onChange={(e) => set("availableSeats", Number(e.target.value))} />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Batch Dates</CardTitle></CardHeader>
            <CardContent>
              <ArrayFieldEditor<DepartureDate>
                items={value.departureDates}
                onChange={(v) => set("departureDates", v)}
                addLabel="Add batch"
                emptyMessage="No batches scheduled yet."
                createItem={() => ({
                  id: nextId("batch"),
                  startDate: "",
                  endDate: "",
                  seatsTotal: 0,
                  seatsAvailable: 0,
                  status: "open",
                  isPublished: true,
                })}
                renderItem={(batch, _i, update) => (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <FormField label="Start Date">
                      <Input type="date" value={batch.startDate} onChange={(e) => update({ startDate: e.target.value })} />
                    </FormField>
                    <FormField label="End Date">
                      <Input type="date" value={batch.endDate} onChange={(e) => update({ endDate: e.target.value })} />
                    </FormField>
                    <FormField label="Seats Total">
                      <Input type="number" min={0} value={batch.seatsTotal} onChange={(e) => update({ seatsTotal: Number(e.target.value) })} />
                    </FormField>
                    <FormField label="Seats Available">
                      <Input type="number" min={0} value={batch.seatsAvailable} onChange={(e) => update({ seatsAvailable: Number(e.target.value) })} />
                    </FormField>
                    <FormField label="Status">
                      <Select value={batch.status} onValueChange={(v) => update({ status: v as DepartureDate["status"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="filling-fast">Filling Fast</SelectItem>
                          <SelectItem value="sold-out">Sold Out</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Publish" hint="Hide from the public Trip page without deleting">
                      <div className="flex h-9 items-center gap-2">
                        <Switch checked={batch.isPublished ?? true} onCheckedChange={(v) => update({ isPublished: v })} />
                        <span className="text-sm text-muted-foreground">{(batch.isPublished ?? true) ? "Published" : "Hidden"}</span>
                      </div>
                    </FormField>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Hero, Cover & Thumbnail</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ImageAssetField label="Hero Image (trip page banner)" value={value.heroImage} onChange={(v) => set("heroImage", v)} category="trip-hero" />
              <ImageAssetField label="Cover Image (used in cards)" value={value.coverImage} onChange={(v) => set("coverImage", v)} category="trip-hero" />
              <ImageAssetField label="Thumbnail" value={value.thumbnail} onChange={(v) => set("thumbnail", v)} category="trip-hero" />
              <ImageAssetField label="Homepage Hero Image" value={value.homepageHeroImage} onChange={(v) => set("homepageHeroImage", v)} category="homepage-hero" hint="Used when this trip is featured on the homepage" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Gallery</CardTitle></CardHeader>
            <CardContent>
              <ArrayFieldEditor
                items={value.gallery}
                onChange={(v) => set("gallery", v)}
                addLabel="Add gallery image"
                emptyMessage="No gallery images yet."
                createItem={emptyImage}
                draggable
                renderItem={(img, _i, update) => (
                  <ImageAssetField label="Gallery Image" value={img} onChange={update} category="trip-gallery" />
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itinerary" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Day-by-Day Itinerary</CardTitle></CardHeader>
            <CardContent>
              <ArrayFieldEditor<DayPlan>
                items={value.itinerary}
                onChange={(v) => set("itinerary", v)}
                addLabel="Add day"
                emptyMessage="No itinerary days yet."
                createItem={() => ({ day: value.itinerary.length + 1, title: "", description: "", activities: [], meals: [], images: [] })}
                draggable
                renderItem={(day, _i, update) => (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField label="Day #">
                        <Input type="number" min={1} value={day.day} onChange={(e) => update({ day: Number(e.target.value) })} />
                      </FormField>
                      <FormField label="Title">
                        <Input value={day.title} onChange={(e) => update({ title: e.target.value })} />
                      </FormField>
                    </div>
                    <FormField label="Description">
                      <Textarea rows={2} value={day.description} onChange={(e) => update({ description: e.target.value })} />
                    </FormField>
                    <FormField label="Activities">
                      <StringListEditor items={day.activities} onChange={(v) => update({ activities: v })} placeholder="e.g. Trek to base camp" />
                    </FormField>
                    <FormField label="Stay">
                      <Input value={day.stay ?? ""} onChange={(e) => update({ stay: e.target.value })} placeholder="e.g. Riverside camp" />
                    </FormField>
                    <FormField label="Day Images" hint="Optional — photos specific to this day">
                      <ArrayFieldEditor
                        items={day.images}
                        onChange={(v) => update({ images: v })}
                        addLabel="Add image"
                        emptyMessage="No images for this day yet."
                        createItem={emptyImage}
                        draggable
                        renderItem={(img, _j, updateImg) => (
                          <ImageAssetField label="Image" value={img} onChange={updateImg} category="trip-gallery" />
                        )}
                      />
                    </FormField>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logistics" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Accommodation</CardTitle></CardHeader>
            <CardContent>
              <ArrayFieldEditor<AccommodationEntry>
                items={value.accommodation}
                onChange={(v) => set("accommodation", v)}
                addLabel="Add hotel"
                emptyMessage="No accommodation added yet."
                createItem={() => ({ id: nextId("hotel"), hotelName: "", roomType: "", roomSharing: "", amenities: [], images: [] })}
                renderItem={(hotel, _i, update) => (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField label="Hotel Name">
                        <Input value={hotel.hotelName} onChange={(e) => update({ hotelName: e.target.value })} />
                      </FormField>
                      <FormField label="Room Type">
                        <Input value={hotel.roomType} onChange={(e) => update({ roomType: e.target.value })} placeholder="e.g. Deluxe Double" />
                      </FormField>
                      <FormField label="Room Sharing" hint="Optional">
                        <Input value={hotel.roomSharing ?? ""} onChange={(e) => update({ roomSharing: e.target.value })} placeholder="e.g. Double sharing" />
                      </FormField>
                      <FormField label="Location" hint="Optional">
                        <Input value={hotel.location ?? ""} onChange={(e) => update({ location: e.target.value })} />
                      </FormField>
                      <FormField label="Notes" hint="Optional" className="sm:col-span-2">
                        <Input value={hotel.notes ?? ""} onChange={(e) => update({ notes: e.target.value })} />
                      </FormField>
                    </div>
                    <FormField label="Amenities" hint="Optional">
                      <StringListEditor items={hotel.amenities ?? []} onChange={(v) => update({ amenities: v })} placeholder="e.g. WiFi" />
                    </FormField>
                    <FormField label="Hotel Images" hint="Optional">
                      <ArrayFieldEditor
                        items={hotel.images}
                        onChange={(v) => update({ images: v })}
                        addLabel="Add image"
                        emptyMessage="No images for this hotel yet."
                        createItem={emptyImage}
                        draggable
                        renderItem={(img, _j, updateImg) => (
                          <ImageAssetField label="Image" value={img} onChange={updateImg} category="trip-gallery" />
                        )}
                      />
                    </FormField>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Meals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="meal-breakfast"
                    checked={value.mealPlan.breakfast}
                    onCheckedChange={(v) => set("mealPlan", { ...value.mealPlan, breakfast: v })}
                  />
                  <label htmlFor="meal-breakfast" className="text-sm font-medium">Breakfast</label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="meal-lunch"
                    checked={value.mealPlan.lunch}
                    onCheckedChange={(v) => set("mealPlan", { ...value.mealPlan, lunch: v })}
                  />
                  <label htmlFor="meal-lunch" className="text-sm font-medium">Lunch</label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="meal-dinner"
                    checked={value.mealPlan.dinner}
                    onCheckedChange={(v) => set("mealPlan", { ...value.mealPlan, dinner: v })}
                  />
                  <label htmlFor="meal-dinner" className="text-sm font-medium">Dinner</label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="meal-snacks"
                    checked={value.mealPlan.snacks}
                    onCheckedChange={(v) => set("mealPlan", { ...value.mealPlan, snacks: v })}
                  />
                  <label htmlFor="meal-snacks" className="text-sm font-medium">Snacks</label>
                </div>
              </div>
              <FormField label="Meal Plan Notes" hint="Optional — e.g. 'Multi-cuisine buffet at hotel restaurants'">
                <Textarea
                  rows={2}
                  value={value.mealPlan.description}
                  onChange={(e) => set("mealPlan", { ...value.mealPlan, description: e.target.value })}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Transportation</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField label="Pickup Point">
                <Input value={value.pickup} onChange={(e) => set("pickup", e.target.value)} />
              </FormField>
              <FormField label="Drop Point">
                <Input value={value.drop} onChange={(e) => set("drop", e.target.value)} />
              </FormField>
              <FormField label="Vehicle" className="md:col-span-2">
                <Input value={value.vehicle} onChange={(e) => set("vehicle", e.target.value)} placeholder="e.g. AC Tempo Traveller" />
              </FormField>
              <FormField label="Travel Notes" className="md:col-span-2" hint="Optional — e.g. luggage limits, boarding instructions">
                <Textarea rows={3} value={value.travelNotes ?? ""} onChange={(e) => set("travelNotes", e.target.value)} />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inclusions" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Inclusions</CardTitle></CardHeader>
            <CardContent>
              <StringListEditor items={value.inclusions} onChange={(v) => set("inclusions", v)} placeholder="e.g. All meals" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Exclusions</CardTitle></CardHeader>
            <CardContent>
              <StringListEditor items={value.exclusions} onChange={(v) => set("exclusions", v)} placeholder="e.g. Personal expenses" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Reviews</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose reviews from the site-wide Testimonials collection. Already-chosen
                testimonials can&apos;t be added twice.
              </p>
            </CardHeader>
            <CardContent>
              <TestimonialPickerField ids={value.reviewIds ?? []} onChange={(v) => set("reviewIds", v)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Reviews (legacy)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Older, trip-specific reviews written directly here rather than assigned from
                Testimonials. Prefer &quot;Assigned Reviews&quot; above for new content.
              </p>
            </CardHeader>
            <CardContent>
              <ArrayFieldEditor<TripReview>
                items={value.reviews}
                onChange={(v) => set("reviews", v)}
                addLabel="Add review"
                emptyMessage="No reviews yet."
                createItem={() => ({
                  id: nextId("review"),
                  customerName: "",
                  customerPhoto: emptyImage(),
                  rating: 5,
                  reviewText: "",
                })}
                renderItem={(review, _i, update) => (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField label="Customer Name">
                        <Input value={review.customerName} onChange={(e) => update({ customerName: e.target.value })} />
                      </FormField>
                      <FormField label="Rating (1–5)">
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={review.rating}
                          onChange={(e) => update({ rating: Number(e.target.value) })}
                        />
                      </FormField>
                    </div>
                    <ImageAssetField
                      label="Customer Photo"
                      value={review.customerPhoto}
                      onChange={(v) => update({ customerPhoto: v })}
                      category="general"
                    />
                    <FormField label="Review">
                      <Textarea rows={3} value={review.reviewText} onChange={(e) => update({ reviewText: e.target.value })} />
                    </FormField>
                    <FormField label="Review Date" hint="Optional">
                      <Input type="date" value={review.reviewDate ?? ""} onChange={(e) => update({ reviewDate: e.target.value })} />
                    </FormField>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">FAQs</CardTitle></CardHeader>
            <CardContent>
              <ArrayFieldEditor<Faq>
                items={value.faqs}
                onChange={(v) => set("faqs", v)}
                addLabel="Add FAQ"
                emptyMessage="No FAQs yet."
                draggable
                createItem={() => ({ id: nextId("faq"), question: "", answer: "" })}
                renderItem={(faq, _i, update) => (
                  <div className="space-y-2">
                    <FormField label="Question">
                      <Input value={faq.question} onChange={(e) => update({ question: e.target.value })} />
                    </FormField>
                    <FormField label="Answer">
                      <Textarea rows={2} value={faq.answer} onChange={(e) => update({ answer: e.target.value })} />
                    </FormField>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Terms & Conditions</CardTitle></CardHeader>
            <CardContent>
              <StringListEditor items={value.termsAndConditions} onChange={(v) => set("termsAndConditions", v)} placeholder="Add a term" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Cancellation Policy</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={4} value={value.cancellationPolicy} onChange={(e) => set("cancellationPolicy", e.target.value)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Google Maps</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <FormField label="Map Query" hint="Free-text location used to build a maps search link">
                <Input value={value.mapQuery} onChange={(e) => set("mapQuery", e.target.value)} />
              </FormField>
              <FormField label="Map Embed URL" hint="Optional — full Google Maps embed iframe src">
                <Input value={value.mapEmbedUrl ?? ""} onChange={(e) => set("mapEmbedUrl", e.target.value)} />
              </FormField>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField label="Meta Title">
                <Input value={value.seo.title} onChange={(e) => set("seo", { ...value.seo, title: e.target.value })} />
              </FormField>
              <FormField label="Meta Description">
                <Input value={value.seo.description} onChange={(e) => set("seo", { ...value.seo, description: e.target.value })} />
              </FormField>
              <FormField label="Keywords" className="md:col-span-2">
                <StringListEditor items={value.seo.keywords} onChange={(v) => set("seo", { ...value.seo, keywords: v })} placeholder="e.g. Spiti valley trip" />
              </FormField>
              <FormField label="Canonical URL" className="md:col-span-2" hint="Optional — full URL this page should be treated as canonical for">
                <Input value={value.seo.canonicalUrl ?? ""} onChange={(e) => set("seo", { ...value.seo, canonicalUrl: e.target.value })} placeholder="https://example.com/trips/your-trip" />
              </FormField>
              <div className="md:col-span-2">
                <ImageAssetField
                  label="Open Graph Image"
                  value={value.seo.ogImage ?? emptyImage()}
                  onChange={(v) => set("seo", { ...value.seo, ogImage: v })}
                  category="trip-hero"
                  hint="Optional — shown when this trip is shared on social media. Falls back to the Hero Image when unset."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : tripId ? "Save Changes" : "Create Trip"}</Button>
      </div>
    </form>
  );
}
