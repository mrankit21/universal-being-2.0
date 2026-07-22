import { describe, it, expect, afterEach } from "vitest";
import {
  formatInvoiceNumber,
  getInvoicePrefix,
  getInvoiceSequencePadding,
  getMaxRetryAttempts,
  getRetryOrderExpiryMinutes,
  getRefundPolicyDays,
} from "./payment-config";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("formatInvoiceNumber", () => {
  it("zero-pads the sequence to the configured width using the default prefix", () => {
    delete process.env.INVOICE_PREFIX;
    delete process.env.INVOICE_SEQUENCE_PADDING;
    expect(formatInvoiceNumber(2026, 47)).toBe("UB-2026-000047");
  });

  it("respects a custom prefix and padding", () => {
    process.env.INVOICE_PREFIX = "ACME";
    process.env.INVOICE_SEQUENCE_PADDING = "4";
    expect(formatInvoiceNumber(2026, 7)).toBe("ACME-2026-0007");
  });

  it("does not truncate a sequence number wider than the configured padding", () => {
    delete process.env.INVOICE_SEQUENCE_PADDING;
    expect(formatInvoiceNumber(2026, 1234567)).toBe("UB-2026-1234567");
  });
});

describe("getInvoicePrefix / getInvoiceSequencePadding", () => {
  it("falls back to sensible defaults when unset", () => {
    delete process.env.INVOICE_PREFIX;
    delete process.env.INVOICE_SEQUENCE_PADDING;
    expect(getInvoicePrefix()).toBe("UB");
    expect(getInvoiceSequencePadding()).toBe(6);
  });

  it("ignores a non-numeric or non-positive padding override", () => {
    process.env.INVOICE_SEQUENCE_PADDING = "not-a-number";
    expect(getInvoiceSequencePadding()).toBe(6);

    process.env.INVOICE_SEQUENCE_PADDING = "-3";
    expect(getInvoiceSequencePadding()).toBe(6);
  });
});

describe("getMaxRetryAttempts", () => {
  it("is unlimited by default", () => {
    delete process.env.PAYMENT_MAX_RETRY_ATTEMPTS;
    expect(getMaxRetryAttempts()).toBe(Infinity);
  });

  it("uses a configured positive cap", () => {
    process.env.PAYMENT_MAX_RETRY_ATTEMPTS = "3";
    expect(getMaxRetryAttempts()).toBe(3);
  });
});

describe("getRetryOrderExpiryMinutes / getRefundPolicyDays", () => {
  it("fall back to documented defaults", () => {
    delete process.env.PAYMENT_RETRY_ORDER_EXPIRY_MINUTES;
    delete process.env.REFUND_POLICY_DAYS;
    expect(getRetryOrderExpiryMinutes()).toBe(15);
    expect(getRefundPolicyDays()).toBe(7);
  });
});
