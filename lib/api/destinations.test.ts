import { describe, it, expect, vi, beforeEach } from "vitest";

const find = vi.fn();
const findOne = vi.fn();
const exists = vi.fn();
const connectToDatabase = vi.fn();

vi.mock("@/lib/db/mongoose", () => ({
  isDatabaseConfigured: () => true,
  connectToDatabase: (...args: unknown[]) => connectToDatabase(...args),
}));

vi.mock("@/lib/db/models", () => ({
  DestinationModel: {
    find: (...args: unknown[]) => find(...args),
    findOne: (...args: unknown[]) => findOne(...args),
    exists: (...args: unknown[]) => exists(...args),
  },
}));

const { getAllDestinations, getDestinationBySlug, getDestinationBySlugWithResolvedImages } = await import(
  "./destinations"
);
const { getTripsByDestination } = await import("./trips");

// A destination doc as it would come back from `.lean()` for a record
// saved before `gallery`, `tripAssignments`, `pointsOfInterest`, and
// `highlights` existed on the schema — i.e. those keys are simply absent,
// not `[]`.
function legacyDestinationDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: "dest-1",
    slug: "ladakh",
    name: "Ladakh",
    status: "published",
    homepageVisible: true,
    heroImage: { provider: "placeholder", url: "", alt: "", width: 1, height: 1, isPlaceholder: true },
    coverImage: { provider: "placeholder", url: "", alt: "", width: 1, height: 1, isPlaceholder: true },
    // thumbnail intentionally absent too
    // gallery, tripAssignments, pointsOfInterest, highlights, bestSeason: absent
    seo: { title: "Ladakh", description: "desc" },
    ...overrides,
  };
}

function chain(resolved: unknown) {
  // Mimics Mongoose's `.find().sort().lean()` / `.find().select().lean()` chainability.
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
  exists.mockReset();
  connectToDatabase.mockReset().mockResolvedValue(undefined);
});

describe("destination legacy-document normalization (regression for build crash)", () => {
  it("getAllDestinations does not throw when a doc is missing gallery/tripAssignments/etc.", async () => {
    find.mockReturnValue(chain([legacyDestinationDoc()]));

    const destinations = await getAllDestinations();

    expect(destinations).toHaveLength(1);
    expect(destinations[0].gallery).toEqual([]);
    expect(destinations[0].tripAssignments).toEqual([]);
    expect(destinations[0].pointsOfInterest).toEqual([]);
    expect(destinations[0].highlights).toEqual([]);
  });

  it("getDestinationBySlug does not throw when the doc is missing those fields", async () => {
    findOne.mockReturnValue(chain(legacyDestinationDoc()));

    const destination = await getDestinationBySlug("ladakh");

    expect(destination).not.toBeNull();
    expect(destination?.gallery).toEqual([]);
    expect(destination?.tripAssignments).toEqual([]);
  });

  it("getDestinationBySlugWithResolvedImages (the destination detail page's data call) does not throw on a legacy doc with no trips", async () => {
    findOne.mockReturnValue(chain(legacyDestinationDoc()));
    // getOrderedDestinationTrips -> getTripsByDestination -> getAllTrips (DB path).
    // Mocking the trips model isn't wired up here, so this exercises the
    // static-registry fallback path for trips while still using the mocked
    // (legacy) destination doc above -- the crash this regression guards
    // against was in the destination-side code (tripAssignments.map /
    // trip.gallery.length), reachable regardless of where the trip list
    // came from.
    const result = await getDestinationBySlugWithResolvedImages("ladakh");

    expect(result).not.toBeNull();
    expect(Array.isArray(result?.trips)).toBe(true);
    // The destination's own gallery normalizes to [] (legacy doc), but
    // `withTripImageFallback` then borrows photos from the representative
    // trip to fill that empty slot — that's the intended "borrow imagery
    // until the destination has its own" behavior, not a bug. The
    // regression this test guards against is the *throw*, not emptiness.
    expect(Array.isArray(result?.destination.gallery)).toBe(true);
  });

  it("falls back to the static registry (not a throw) when the destination collection is unreachable", async () => {
    findOne.mockImplementation(() => {
      throw new Error("connection timed out");
    });

    const destination = await getDestinationBySlug("ladakh");
    // Falls back to the static seed registry, which does have a "ladakh" entry.
    expect(destination).not.toBeNull();
    expect(destination?.gallery.length).toBeGreaterThan(0);
  });

  it("getTripsByDestination re-export is usable alongside the destination fallback (sanity check for the mocked module boundary)", async () => {
    expect(typeof getTripsByDestination).toBe("function");
  });
});
