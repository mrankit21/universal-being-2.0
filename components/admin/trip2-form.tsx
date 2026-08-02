/* eslint-disable @typescript-eslint/no-explicit-any -- edits a loosely-typed JSON document by design, same as components/admin/trip-form.tsx and app/admin/(dashboard)/homepage2/page.tsx */
"use client";

/**
 * Trip2Form — the single reusable create/edit form for Trip 2.0 pages,
 * covering every section in `components/trip/v2/*`: hero image, title
 * block, quick links, gallery, hotel tiers, itinerary, inclusions/
 * exclusions, price, pickup variants, batch dates, things to experience,
 * did you know, and FAQs. Same Card-per-section shape as
 * `app/admin/(dashboard)/homepage2/page.tsx` (a single-document editor,
 * not tabs) since a Trip 2.0 page's fields aren't independently loaded
 * the way `TripForm`'s tabs are.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FormField } from "@/components/admin/form-field";
import { ImageAssetField } from "@/components/admin/image-asset-field";
import { ArrayFieldEditor } from "@/components/admin/array-field-editor";
import { StringListEditor } from "@/components/admin/string-list-editor";
import { TRIP2_ICON_NAMES } from "@/components/trip/v2/icon-registry";

const BLANK_IMAGE = { provider: "placeholder", url: "", alt: "", width: 1600, height: 900, isPlaceholder: true };

function blankTrip2(): any {
  return {
    slug: "",
    status: "draft",
    title: "",
    shortDescription: "",
    location: "",
    durationLabel: "",
    groupSizeLabel: "",
    heroImage: { ...BLANK_IMAGE },
    bookHref: "",
    quickLinks: [],
    gallery: [],
    hotelTiers: [],
    itinerary: [],
    inclusions: [],
    exclusions: [],
    price: { basePrice: 0, discountedPrice: undefined, bookingAmount: 0 },
    pickupVariants: [],
    batchDates: [],
    thingsToExperience: [],
    didYouKnow: [],
    faqs: [],
    leadFormDestination: "",
  };
}

const emptyQuickLink = () => ({ icon: "Sparkles", label: "", href: "#", order: 0 });
const emptyGalleryImage = () => ({ image: { ...BLANK_IMAGE }, caption: "", order: 0 });
const emptyHotelTier = () => ({ stars: 3, label: "", description: "" });
const emptyItineraryDay = () => ({ day: 1, title: "", location: "", image: { ...BLANK_IMAGE }, description: "" });
const emptyPickupVariant = () => ({ city: "", note: "" });
const emptyBatchDate = () => ({ startDate: "", endDate: "", seatsTotal: 16, seatsAvailable: 16, status: "open" });
const emptyExperience = () => ({ tag: "", title: "", description: "", href: "#", image: { ...BLANK_IMAGE } });
const emptyFact = () => ({ icon: "Globe2", title: "", description: "", href: "#" });
const emptyFaq = () => ({ question: "", answer: "" });

export function Trip2Form({ tripId, initialValue }: { tripId?: string; initialValue?: any }) {
  const router = useRouter();
  const [value, setValue] = useState<any>(initialValue ?? blankTrip2());
  const [saving, setSaving] = useState(false);

  function set(key: string, val: unknown) {
    setValue((prev: any) => ({ ...prev, [key]: val }));
  }

  // Quick Links / Gallery both carry an `order` field the schema uses for
  // sorting; rather than expose a separate numeric input for it, the
  // ArrayFieldEditor's own position already IS the intended order — this
  // just stamps index -> order right before saving.
  function withOrder<T>(items: T[]): (T & { order: number })[] {
    return items.map((item, i) => ({ ...(item as object), order: i }) as T & { order: number });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.slug?.trim()) {
      toast.error("Slug is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...value,
        quickLinks: withOrder(value.quickLinks ?? []),
        gallery: withOrder(value.gallery ?? []),
      };
      const url = tripId ? `/api/admin/trip2/${tripId}` : "/api/admin/trip2";
      const method = tripId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Something went wrong");
        return;
      }
      toast.success(tripId ? "Trip 2.0 page updated" : "Trip 2.0 page created");
      router.push("/admin/trip2");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <FormField label="Status" className="w-40">
          <Select value={value.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : tripId ? "Save Changes" : "Create Trip 2.0 Page"}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Info</CardTitle>
          <p className="text-sm text-muted-foreground">Slug, title, short description, and the meta row (location/duration/group size) shown under the hero.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Slug (URL: /trip2/…)" hint="Lowercase letters, numbers and hyphens only.">
            <Input value={value.slug} onChange={(e) => set("slug", e.target.value)} placeholder="spiti-valley" disabled={!!tripId} />
          </FormField>
          <FormField label="Title">
            <Input value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="Spiti Valley, Reimagined" />
          </FormField>
          <FormField label="Short Description" className="md:col-span-2">
            <Textarea rows={2} value={value.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          </FormField>
          <FormField label="Location">
            <Input value={value.location} onChange={(e) => set("location", e.target.value)} placeholder="Himachal Pradesh, India" />
          </FormField>
          <FormField label="Duration Label">
            <Input value={value.durationLabel} onChange={(e) => set("durationLabel", e.target.value)} placeholder="7 Days / 6 Nights" />
          </FormField>
          <FormField label="Group Size Label">
            <Input value={value.groupSizeLabel} onChange={(e) => set("groupSizeLabel", e.target.value)} placeholder="12–16 travellers" />
          </FormField>
          <FormField label="Book Now Link" hint="Where the Book Now / Reserve buttons go. Leave blank to default to the Price section on this page.">
            <Input value={value.bookHref} onChange={(e) => set("bookHref", e.target.value)} placeholder="/trips/spiti-valley/book" />
          </FormField>
          <FormField label="Lead Form Destination" hint="Prefills the 'Let's Plan Your Trip' form. Leave blank to use the Title.">
            <Input value={value.leadFormDestination} onChange={(e) => set("leadFormDestination", e.target.value)} placeholder={value.title || "Trip title"} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Hero Image</CardTitle></CardHeader>
        <CardContent>
          <ImageAssetField label="Hero Background Image" value={value.heroImage ?? BLANK_IMAGE} onChange={(v) => set("heroImage", v)} category="trip-hero" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Links</CardTitle>
          <p className="text-sm text-muted-foreground">The row of tiles under the title (Hotels, Highlights, Itinerary, Gallery…). Order here = display order.</p>
        </CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.quickLinks ?? []}
            onChange={(next) => set("quickLinks", next)}
            draggable
            createItem={emptyQuickLink}
            addLabel="Add Quick Link"
            emptyMessage="No quick links yet."
            renderItem={(item: any, _i, update) => (
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField label="Icon">
                  <Select value={item.icon} onValueChange={(v) => update({ icon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIP2_ICON_NAMES.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Label">
                  <Input value={item.label} onChange={(e) => update({ label: e.target.value })} placeholder="Hotels" />
                </FormField>
                <FormField label="Links to" hint="Anchor on this page (#gallery) or any URL.">
                  <Input value={item.href} onChange={(e) => update({ href: e.target.value })} placeholder="#gallery" />
                </FormField>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Gallery</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.gallery ?? []}
            onChange={(next) => set("gallery", next)}
            draggable
            createItem={emptyGalleryImage}
            addLabel="Add Photo"
            emptyMessage="No gallery photos yet."
            renderItem={(item: any, _i, update) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <ImageAssetField label="Photo" value={item.image ?? BLANK_IMAGE} onChange={(v) => update({ image: v })} category="trip-gallery" />
                <FormField label="Caption (optional)">
                  <Input value={item.caption} onChange={(e) => update({ caption: e.target.value })} />
                </FormField>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hotel Tiers</CardTitle>
          <p className="text-sm text-muted-foreground">The 3/4/5-star category cards. The Hotels quick link jumps here.</p>
        </CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.hotelTiers ?? []}
            onChange={(next) => set("hotelTiers", next)}
            createItem={emptyHotelTier}
            addLabel="Add Hotel Tier"
            emptyMessage="No hotel tiers yet."
            renderItem={(item: any, _i, update) => (
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField label="Stars (1–5)">
                  <Input type="number" min={1} max={5} value={item.stars} onChange={(e) => update({ stars: Number(e.target.value) })} />
                </FormField>
                <FormField label="Label">
                  <Input value={item.label} onChange={(e) => update({ label: e.target.value })} placeholder="4 Star" />
                </FormField>
                <FormField label="Description">
                  <Input value={item.description} onChange={(e) => update({ description: e.target.value })} placeholder="Elevated comfort & service" />
                </FormField>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Itinerary</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.itinerary ?? []}
            onChange={(next) => set("itinerary", next)}
            draggable
            createItem={emptyItineraryDay}
            addLabel="Add Day"
            emptyMessage="No itinerary days yet."
            renderItem={(item: any, _i, update) => (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField label="Day #">
                    <Input type="number" min={1} value={item.day} onChange={(e) => update({ day: Number(e.target.value) })} />
                  </FormField>
                  <FormField label="Title" className="sm:col-span-2">
                    <Input value={item.title} onChange={(e) => update({ title: e.target.value })} placeholder="Arrival in Shimla, drive to Kalpa" />
                  </FormField>
                  <FormField label="Location">
                    <Input value={item.location} onChange={(e) => update({ location: e.target.value })} placeholder="Kalpa" />
                  </FormField>
                </div>
                <FormField label="Description">
                  <Textarea rows={2} value={item.description} onChange={(e) => update({ description: e.target.value })} />
                </FormField>
                <ImageAssetField label="Photo" value={item.image ?? BLANK_IMAGE} onChange={(v) => update({ image: v })} category="trip-gallery" />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Inclusions &amp; Exclusions</CardTitle></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Inclusions</p>
            <StringListEditor items={value.inclusions ?? []} onChange={(next) => set("inclusions", next)} placeholder="AC transport for the entire trip" addLabel="Add Inclusion" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Exclusions</p>
            <StringListEditor items={value.exclusions ?? []} onChange={(next) => set("exclusions", next)} placeholder="Flights to/from the starting point" addLabel="Add Exclusion" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Price</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <FormField label="Base Price (₹)">
            <Input type="number" min={0} value={value.price?.basePrice ?? 0} onChange={(e) => set("price", { ...value.price, basePrice: Number(e.target.value) })} />
          </FormField>
          <FormField label="Discounted Price (₹)" hint="Leave blank for no discount.">
            <Input
              type="number"
              min={0}
              value={value.price?.discountedPrice ?? ""}
              onChange={(e) => set("price", { ...value.price, discountedPrice: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Booking Amount (₹)">
            <Input type="number" min={0} value={value.price?.bookingAmount ?? 0} onChange={(e) => set("price", { ...value.price, bookingAmount: Number(e.target.value) })} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pickup Variants</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.pickupVariants ?? []}
            onChange={(next) => set("pickupVariants", next)}
            createItem={emptyPickupVariant}
            addLabel="Add Pickup City"
            emptyMessage="No pickup cities yet."
            renderItem={(item: any, _i, update) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="City">
                  <Input value={item.city} onChange={(e) => update({ city: e.target.value })} placeholder="Delhi" />
                </FormField>
                <FormField label="Note (optional)">
                  <Input value={item.note} onChange={(e) => update({ note: e.target.value })} placeholder="Default / Self-arrival" />
                </FormField>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Batch Dates</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.batchDates ?? []}
            onChange={(next) => set("batchDates", next)}
            createItem={emptyBatchDate}
            addLabel="Add Batch"
            emptyMessage="No batch dates yet."
            renderItem={(item: any, _i, update) => (
              <div className="grid gap-3 sm:grid-cols-5">
                <FormField label="Start Date">
                  <Input type="date" value={item.startDate} onChange={(e) => update({ startDate: e.target.value })} />
                </FormField>
                <FormField label="End Date">
                  <Input type="date" value={item.endDate} onChange={(e) => update({ endDate: e.target.value })} />
                </FormField>
                <FormField label="Seats Total">
                  <Input type="number" min={0} value={item.seatsTotal} onChange={(e) => update({ seatsTotal: Number(e.target.value) })} />
                </FormField>
                <FormField label="Seats Available">
                  <Input type="number" min={0} value={item.seatsAvailable} onChange={(e) => update({ seatsAvailable: Number(e.target.value) })} />
                </FormField>
                <FormField label="Status">
                  <Select value={item.status} onValueChange={(v) => update({ status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="filling-fast">Filling fast</SelectItem>
                      <SelectItem value="sold-out">Sold out</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Things To Experience</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.thingsToExperience ?? []}
            onChange={(next) => set("thingsToExperience", next)}
            draggable
            createItem={emptyExperience}
            addLabel="Add Experience"
            emptyMessage="No experiences yet."
            renderItem={(item: any, _i, update) => (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Tag (e.g. Stargazing)">
                    <Input value={item.tag} onChange={(e) => update({ tag: e.target.value })} />
                  </FormField>
                  <FormField label="Title">
                    <Input value={item.title} onChange={(e) => update({ title: e.target.value })} placeholder="Sleep under the stars" />
                  </FormField>
                </div>
                <FormField label="Description">
                  <Textarea rows={2} value={item.description} onChange={(e) => update({ description: e.target.value })} />
                </FormField>
                <ImageAssetField label="Photo" value={item.image ?? BLANK_IMAGE} onChange={(v) => update({ image: v })} category="trip-gallery" />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Did You Know</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.didYouKnow ?? []}
            onChange={(next) => set("didYouKnow", next)}
            draggable
            createItem={emptyFact}
            addLabel="Add Fact"
            emptyMessage="No facts yet."
            renderItem={(item: any, _i, update) => (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Icon">
                    <Select value={item.icon} onValueChange={(v) => update({ icon: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TRIP2_ICON_NAMES.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Title">
                    <Input value={item.title} onChange={(e) => update({ title: e.target.value })} placeholder="A Cold Desert" />
                  </FormField>
                </div>
                <FormField label="Description">
                  <Textarea rows={2} value={item.description} onChange={(e) => update({ description: e.target.value })} />
                </FormField>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">FAQs</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.faqs ?? []}
            onChange={(next) => set("faqs", next)}
            draggable
            createItem={emptyFaq}
            addLabel="Add FAQ"
            emptyMessage="No FAQs yet."
            renderItem={(item: any, _i, update) => (
              <div className="space-y-3">
                <FormField label="Question">
                  <Input value={item.question} onChange={(e) => update({ question: e.target.value })} />
                </FormField>
                <FormField label="Answer">
                  <Textarea rows={2} value={item.answer} onChange={(e) => update({ answer: e.target.value })} />
                </FormField>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : tripId ? "Save Changes" : "Create Trip 2.0 Page"}</Button>
      </div>
    </form>
  );
}
