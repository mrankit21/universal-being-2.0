import { describe, it, expect, vi, beforeEach } from "vitest";

const find = vi.fn();
const findOne = vi.fn();
const connectToDatabase = vi.fn();

vi.mock("@/lib/db/mongoose", () => ({
  isDatabaseConfigured: () => true,
  connectToDatabase: (...args: unknown[]) => connectToDatabase(...args),
}));

vi.mock("@/lib/db/models", () => ({
  TripModel: {
    find: (...args: unknown[]) => find(...args),
    findOne: (...args: unknown[]) => findOne(...args),
    exists: vi.fn(),
  },
}));

const { getAllTrips, getTripBySlug } = await import("./trips");

// A trip doc as it would come back from `.lean()` for a record saved
// before `gallery`, `highlights`, `departureDates`, and `bestSeason`
// existed on the schema — those keys are simply absent, not `[]`.
function legacyTripDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: "trip-1",
    slug: "leh-ladakh-expedition",
    title: "Leh-Ladakh Expedition",
    status: "published",
    themeKey: "winter",
    difficulty: "moderate",
    duration: { days: 7, nights: 6, label: "7 days / 6 nights" },
    groupSize: { min: 4, max: 12 },
    price: { base: 25000, bookingAmount: 5000, currency: "INR" },
    shortDescription: "short",
    destinationSlug: "ladakh",
    destinationName: "Ladakh",
    mealPlan: undefined,
    // gallery, highlights, departureDates, bestSeason, itinerary,
    // accommodation, reviewIds, seo: all intentionally absent
    ...overrides,
  };
}

function chain(resolved: unknown) {
  const thenable = {
    sort: () => thenable,
    select: () => thenable,
    lean: () => Promise.resolve(resolved),
  };
  return thenable;
}

beforeEach(() => {
  find.mockReset();
  findOne.mockReset();
  connectToDatabase.mockReset().mockResolvedValue(undefined);
});

describe("normalizeTrip (regression for legacy-document build crash)", () => {
  it("getAllTrips backfills missing array fields instead of leaving them undefined", async () => {
    find.mockReturnValue(chain([legacyTripDoc()]));

    const trips = await getAllTrips();

    expect(trips).toHaveLength(1);
    expect(trips[0].gallery).toEqual([]);
    expect(trips[0].highlights).toEqual([]);
    expect(trips[0].departureDates).toEqual([]);
    expect(trips[0].bestSeason).toEqual([]);
    expect(trips[0].itinerary).toEqual([]);
    expect(trips[0].accommodation).toEqual([]);
    expect(trips[0].reviewIds).toEqual([]);
  });

  it("getTripBySlug backfills the same fields for a single legacy doc", async () => {
    findOne.mockReturnValue(chain(legacyTripDoc()));

    const trip = await getTripBySlug("leh-ladakh-expedition");

    expect(trip).not.toBeNull();
    expect(trip?.gallery).toEqual([]);
    expect(trip?.departureDates).toEqual([]);
  });

  it("does not clobber a trip that already has these fields populated", async () => {
    const gallery = [{ provider: "placeholder", url: "x", alt: "x", width: 1, height: 1, isPlaceholder: true }];
    findOne.mockReturnValue(chain(legacyTripDoc({ gallery, highlights: ["Great views"] })));

    const trip = await getTripBySlug("leh-ladakh-expedition");

    expect(trip?.gallery).toBe(gallery);
    expect(trip?.highlights).toEqual(["Great views"]);
  });
});
