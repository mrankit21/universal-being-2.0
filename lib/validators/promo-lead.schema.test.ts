import { describe, it, expect } from "vitest";
import { promoLeadCreateSchema } from "./promo-lead.schema";

describe("promoLeadCreateSchema", () => {
  const base = { fullName: "Asha Rao", whatsappNumber: "9876543210", couponCode: "ESCAPE10" };

  it("accepts a valid 10-digit Indian mobile number", () => {
    const result = promoLeadCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects a full name shorter than 2 characters", () => {
    const result = promoLeadCreateSchema.safeParse({ ...base, fullName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects a whatsapp number that doesn't start with 6-9", () => {
    const result = promoLeadCreateSchema.safeParse({ ...base, whatsappNumber: "1234567890" });
    expect(result.success).toBe(false);
  });

  it("rejects a whatsapp number that isn't exactly 10 digits", () => {
    expect(promoLeadCreateSchema.safeParse({ ...base, whatsappNumber: "98765432" }).success).toBe(false);
    expect(promoLeadCreateSchema.safeParse({ ...base, whatsappNumber: "987654321099" }).success).toBe(false);
  });

  it("rejects a whatsapp number containing non-digit characters", () => {
    const result = promoLeadCreateSchema.safeParse({ ...base, whatsappNumber: "98765-4321" });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from full name", () => {
    const result = promoLeadCreateSchema.safeParse({ ...base, fullName: "  Asha Rao  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fullName).toBe("Asha Rao");
  });
});
