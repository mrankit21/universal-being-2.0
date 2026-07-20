import { describe, it, expect, vi, beforeEach } from "vitest";

const invoiceFindById = vi.fn();
const invoiceCreate = vi.fn();
const bookingUpdateOne = vi.fn();
const nextSequence = vi.fn();

vi.mock("@/lib/db/models/invoice.model", () => ({
  InvoiceModel: {
    findById: (...args: unknown[]) => invoiceFindById(...args),
    create: (...args: unknown[]) => invoiceCreate(...args),
  },
}));

vi.mock("@/lib/db/models/booking.model", () => ({
  BookingModel: {
    updateOne: (...args: unknown[]) => bookingUpdateOne(...args),
  },
}));

vi.mock("@/lib/db/models/counter.model", () => ({
  nextSequence: (...args: unknown[]) => nextSequence(...args),
}));

const { ensureInvoiceForBooking } = await import("./invoicing");

function baseBooking(overrides: Record<string, unknown> = {}) {
  return {
    _id: "booking-1",
    invoiceId: undefined,
    totalAmount: 10000,
    discountAmount: 0,
    couponDiscountAmount: 0,
    amountPaid: 10000,
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "+911234567890",
    tripTitle: "Ladakh Expedition",
    seatsBooked: 2,
    currency: "INR",
    ...overrides,
  };
}

beforeEach(() => {
  invoiceFindById.mockReset();
  invoiceCreate.mockReset();
  bookingUpdateOne.mockReset();
  nextSequence.mockReset();
  delete process.env.INVOICE_PREFIX;
  delete process.env.INVOICE_SEQUENCE_PADDING;
  delete process.env.GST_RATE_PERCENT;
});

describe("ensureInvoiceForBooking", () => {
  it("is idempotent: returns the existing invoice unchanged when the booking already has one", async () => {
    const existingInvoice = { _id: "inv-1", invoiceNumber: "UB-2026-000001" };
    invoiceFindById.mockResolvedValue(existingInvoice);

    const result = await ensureInvoiceForBooking(baseBooking({ invoiceId: "inv-1" }) as never);

    expect(result).toBe(existingInvoice);
    expect(invoiceFindById).toHaveBeenCalledWith("inv-1");
    expect(nextSequence).not.toHaveBeenCalled();
    expect(invoiceCreate).not.toHaveBeenCalled();
  });

  it("draws the invoice number from the atomic per-year counter, not a plain read-then-increment", async () => {
    nextSequence.mockResolvedValue(47);
    invoiceCreate.mockResolvedValue({ _id: "inv-47", invoiceNumber: "placeholder" });
    bookingUpdateOne.mockResolvedValue({});

    await ensureInvoiceForBooking(baseBooking() as never);

    const year = new Date().getFullYear();
    expect(nextSequence).toHaveBeenCalledWith(`invoice:${year}`);
    expect(nextSequence).toHaveBeenCalledTimes(1);

    const createArgs = invoiceCreate.mock.calls[0][0];
    expect(createArgs.invoiceNumber).toBe(`UB-${year}-000047`);
  });

  it("persists invoiceId + invoiceNumber back onto the booking after creating the invoice", async () => {
    nextSequence.mockResolvedValue(1);
    invoiceCreate.mockResolvedValue({ _id: "inv-1", invoiceNumber: "UB-2026-000001" });
    bookingUpdateOne.mockResolvedValue({});

    await ensureInvoiceForBooking(baseBooking() as never);

    expect(bookingUpdateOne).toHaveBeenCalledWith(
      { _id: "booking-1" },
      { $set: { invoiceId: "inv-1", invoiceNumber: expect.any(String) } }
    );
  });

  it("computes subtotal as totalAmount + discountAmount + couponDiscountAmount (pre-discount price)", async () => {
    nextSequence.mockResolvedValue(1);
    invoiceCreate.mockResolvedValue({ _id: "inv-1" });
    bookingUpdateOne.mockResolvedValue({});

    await ensureInvoiceForBooking(
      baseBooking({ totalAmount: 9000, discountAmount: 500, couponDiscountAmount: 500 }) as never
    );

    const createArgs = invoiceCreate.mock.calls[0][0];
    expect(createArgs.subtotal).toBe(10000);
    expect(createArgs.discountAmount).toBe(1000);
  });

  it("applies GST on top of totalAmount only when a GST rate is configured", async () => {
    process.env.GST_RATE_PERCENT = "18";
    nextSequence.mockResolvedValue(1);
    invoiceCreate.mockResolvedValue({ _id: "inv-1" });
    bookingUpdateOne.mockResolvedValue({});

    await ensureInvoiceForBooking(baseBooking({ totalAmount: 10000, amountPaid: 10000 }) as never);

    const createArgs = invoiceCreate.mock.calls[0][0];
    expect(createArgs.gstAmount).toBe(1800);
    expect(createArgs.totalAmount).toBe(11800);
    expect(createArgs.balanceDue).toBe(1800);
  });

  it("never lets balanceDue go negative when the booking is overpaid", async () => {
    nextSequence.mockResolvedValue(1);
    invoiceCreate.mockResolvedValue({ _id: "inv-1" });
    bookingUpdateOne.mockResolvedValue({});

    await ensureInvoiceForBooking(baseBooking({ totalAmount: 10000, amountPaid: 15000 }) as never);

    const createArgs = invoiceCreate.mock.calls[0][0];
    expect(createArgs.balanceDue).toBe(0);
  });
});
