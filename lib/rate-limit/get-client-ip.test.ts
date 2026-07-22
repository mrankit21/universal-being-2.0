import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { getClientIp } from "./get-client-ip";

function reqWithHeaders(headers: Record<string, string>) {
  return new NextRequest("http://localhost/api/bookings", { headers });
}

describe("getClientIp", () => {
  it("prefers the first entry of x-forwarded-for (the original client, not intermediate proxies)", () => {
    const req = reqWithHeaders({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3" });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });

  it("trims whitespace around the first x-forwarded-for entry", () => {
    const req = reqWithHeaders({ "x-forwarded-for": "  1.1.1.1  , 2.2.2.2" });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = reqWithHeaders({ "x-real-ip": "9.9.9.9" });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("falls back to a constant when neither header is present (local dev)", () => {
    const req = reqWithHeaders({});
    expect(getClientIp(req)).toBe("unknown");
  });

  it("prefers x-forwarded-for over x-real-ip when both are present", () => {
    const req = reqWithHeaders({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "9.9.9.9" });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });
});
