import { describe, it, expect, vi, beforeEach } from "vitest";

const findOne = vi.fn();
const countDocuments = vi.fn();
const findOneAndUpdate = vi.fn();
const redemptionCreate = vi.fn();
const findOneAndDelete = vi.fn();
const couponUpdateOne = vi.fn();

vi.mock("@/lib/db/models/coupon.model", () => ({
  CouponModel: {
    findOne: (...args: unknown[]) => findOne(...args),
    findOneAndUpdate: (...args: unknown[]) => findOneAndUpdate(...args),
    updateOne: (...args: unknown[]) => couponUpdateOne(...args),
  },
  CouponRedemptionModel: {
    countDocuments: (...args: unknown[]) => countDocuments(...args),
    create: (...args: unknown[]) => redemptionCreate(...args),
    findOneAndDelete: (...args: unknown[]) => findOneAndDelete(...args),
  },
}));

const { validateCoupon, redeemCoupon, releaseCouponRedemption } = await import("./validate-coupon");

function baseCoupon(overrides: Record<string, unknown> = {}) {
  return {
    _id: "coupon-1",
    code: "SAVE10",
    active: true,
    type: "percentage",
    value: 10,
    usedCount: 0,
    tripIds: [],
    ...overrides,
  };
}

beforeEach(() => {
  findOne.mockReset();
  countDocuments.mockReset();
  findOneAndUpdate.mockReset();
  redemptionCreate.mockReset();
  findOneAndDelete.mockReset();
  couponUpdateOne.mockReset();
});

describe("validateCoupon", () => {
  it("rejects an empty code without hitting the database", async () => {
    const result = await validateCoupon({ code: "  ", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.valid).toBe(false);
    expect(findOne).not.toHaveBeenCalled();
  });

  it("rejects an unknown code", async () => {
    findOne.mockResolvedValue(null);
    const result = await validateCoupon({ code: "NOPE", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/not found/i);
  });

  it("upper-cases and trims the code before lookup", async () => {
    findOne.mockResolvedValue(null);
    await validateCoupon({ code: "  save10 ", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(findOne).toHaveBeenCalledWith({ code: "SAVE10" });
  });

  it("rejects an inactive coupon", async () => {
    findOne.mockResolvedValue(baseCoupon({ active: false }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/no longer active/i);
  });

  it("rejects a coupon that hasn't started yet", async () => {
    findOne.mockResolvedValue(baseCoupon({ startDate: "2099-01-01" }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/isn't active yet/i);
  });

  it("rejects an expired coupon", async () => {
    findOne.mockResolvedValue(baseCoupon({ endDate: "2000-01-01" }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/expired/i);
  });

  it("rejects a coupon scoped to other trips", async () => {
    findOne.mockResolvedValue(baseCoupon({ tripIds: ["other-trip"] }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/isn't valid for this trip/i);
  });

  it("allows a coupon scoped to a trip list that includes the current trip", async () => {
    findOne.mockResolvedValue(baseCoupon({ tripIds: ["t1", "t2"] }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.valid).toBe(true);
  });

  it("rejects when the amount is under the coupon's minimum", async () => {
    findOne.mockResolvedValue(baseCoupon({ minAmount: 5000 }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/minimum amount/i);
  });

  it("rejects when the global usage limit has been reached", async () => {
    findOne.mockResolvedValue(baseCoupon({ usageLimit: 5, usedCount: 5 }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/usage limit/i);
  });

  it("rejects when the customer already hit their per-user limit", async () => {
    findOne.mockResolvedValue(baseCoupon({ perUserLimit: 1 }));
    countDocuments.mockResolvedValue(1);
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/maximum number of times/i);
  });

  it("lower-cases the customer email when checking per-user redemption count", async () => {
    findOne.mockResolvedValue(baseCoupon({ perUserLimit: 1 }));
    countDocuments.mockResolvedValue(0);
    await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "A@B.COM", amount: 1000 });
    expect(countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: "a@b.com" })
    );
  });

  it("computes a percentage discount and rounds it", async () => {
    findOne.mockResolvedValue(baseCoupon({ type: "percentage", value: 15 }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 999 });
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(Math.round(999 * 0.15));
  });

  it("caps a percentage discount at maxDiscount", async () => {
    findOne.mockResolvedValue(baseCoupon({ type: "percentage", value: 50, maxDiscount: 200 }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 10000 });
    expect(result.discountAmount).toBe(200);
  });

  it("uses a flat discount value for flat-type coupons", async () => {
    findOne.mockResolvedValue(baseCoupon({ type: "flat", value: 300 }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 10000 });
    expect(result.discountAmount).toBe(300);
  });

  it("never lets the discount exceed the order amount", async () => {
    findOne.mockResolvedValue(baseCoupon({ type: "flat", value: 5000 }));
    const result = await validateCoupon({ code: "SAVE10", tripId: "t1", customerEmail: "a@b.com", amount: 1000 });
    expect(result.discountAmount).toBe(1000);
  });
});

describe("redeemCoupon (atomic usage-limit race fix)", () => {
  it("increments usedCount and records a redemption on success", async () => {
    findOneAndUpdate.mockResolvedValue(baseCoupon({ usedCount: 1 }));
    redemptionCreate.mockResolvedValue({});

    const ok = await redeemCoupon({
      coupon: baseCoupon() as never,
      bookingId: "b1",
      customerEmail: "A@B.com",
      discountAmount: 100,
    });

    expect(ok).toBe(true);
    expect(redemptionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: "b1", customerEmail: "a@b.com", discountAmount: 100 })
    );
  });

  it("uses a single atomic findOneAndUpdate (query + $inc) rather than a separate read then write", async () => {
    findOneAndUpdate.mockResolvedValue(baseCoupon({ usedCount: 1 }));
    redemptionCreate.mockResolvedValue({});

    await redeemCoupon({
      coupon: baseCoupon() as never,
      bookingId: "b1",
      customerEmail: "a@b.com",
      discountAmount: 100,
    });

    expect(findOneAndUpdate).toHaveBeenCalledTimes(1);
    const [filter, update] = findOneAndUpdate.mock.calls[0];
    expect(update).toEqual({ $inc: { usedCount: 1 } });
    // the filter must re-check the usage limit as part of the same atomic op
    expect(JSON.stringify(filter)).toContain("usedCount");
  });

  it("returns false without creating a redemption when a concurrent request already used the last slot", async () => {
    // findOneAndUpdate matches nothing -> null, simulating the limit being hit
    // by a concurrent request between validateCoupon() and redeemCoupon().
    findOneAndUpdate.mockResolvedValue(null);

    const ok = await redeemCoupon({
      coupon: baseCoupon({ usageLimit: 1, usedCount: 0 }) as never,
      bookingId: "b1",
      customerEmail: "a@b.com",
      discountAmount: 100,
    });

    expect(ok).toBe(false);
    expect(redemptionCreate).not.toHaveBeenCalled();
  });
});

describe("releaseCouponRedemption", () => {
  it("no-ops when no redemption exists for the booking", async () => {
    findOneAndDelete.mockResolvedValue(null);
    const released = await releaseCouponRedemption("b1");
    expect(released).toBe(false);
    expect(couponUpdateOne).not.toHaveBeenCalled();
  });

  it("decrements usedCount when a redemption is found and deleted", async () => {
    findOneAndDelete.mockResolvedValue({ couponId: "coupon-1", bookingId: "b1" });
    couponUpdateOne.mockResolvedValue({});
    const released = await releaseCouponRedemption("b1");
    expect(released).toBe(true);
    expect(couponUpdateOne).toHaveBeenCalledWith({ _id: "coupon-1" }, { $inc: { usedCount: -1 } });
  });

  it("is safe to call twice for the same booking (idempotent release)", async () => {
    findOneAndDelete.mockResolvedValueOnce({ couponId: "coupon-1", bookingId: "b1" });
    findOneAndDelete.mockResolvedValueOnce(null);
    couponUpdateOne.mockResolvedValue({});

    const first = await releaseCouponRedemption("b1");
    const second = await releaseCouponRedemption("b1");

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(couponUpdateOne).toHaveBeenCalledTimes(1);
  });
});
