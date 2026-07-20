import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { ok, created, fail, handleApiError } from "./respond";

describe("ok / created / fail", () => {
  it("wraps data in a success envelope with the given status", async () => {
    const res = ok({ id: 1 }, 200);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: { id: 1 } });
  });

  it("created() is a 201 shortcut for ok()", async () => {
    const res = created({ id: 1 });
    expect(res.status).toBe(201);
  });

  it("fail() wraps an error envelope with the given status and details", async () => {
    const res = fail("Something broke", 418, { hint: "teapot" });
    const body = await res.json();
    expect(res.status).toBe(418);
    expect(body).toEqual({ success: false, error: "Something broke", details: { hint: "teapot" } });
  });

  it("fail() defaults to 400", () => {
    const res = fail("bad request");
    expect(res.status).toBe(400);
  });
});

describe("handleApiError", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("turns a ZodError into a 422 with flattened field errors", async () => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse({ email: "not-an-email" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const res = handleApiError(parsed.error);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeTruthy();
  });

  it("maps the UNAUTHENTICATED sentinel to 401 without leaking internals", async () => {
    const res = handleApiError(new Error("UNAUTHENTICATED"));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe("Authentication required");
  });

  it("maps the FORBIDDEN sentinel to 403", async () => {
    const res = handleApiError(new Error("FORBIDDEN"));
    expect(res.status).toBe(403);
  });

  it("maps the NOT_FOUND sentinel to 404", async () => {
    const res = handleApiError(new Error("NOT_FOUND"));
    expect(res.status).toBe(404);
  });

  it("surfaces config errors (missing env vars) as 503 with the real message — ops needs to see this", async () => {
    const res = handleApiError(new Error("MONGODB_URI is not set"));
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.error).toBe("MONGODB_URI is not set");
  });

  it("regression: an unexpected exception is always logged server-side, not just returned to the client", () => {
    handleApiError(new Error("Cannot read properties of undefined (reading 'foo')"));
    expect(errorSpy).toHaveBeenCalled();
    const loggedArgs = errorSpy.mock.calls.flat().join(" ");
    expect(loggedArgs).toContain("[api] unhandled error");
  });

  it("an unexpected exception still returns a 500 with its message to the client (existing contract)", async () => {
    const res = handleApiError(new Error("Cannot read properties of undefined (reading 'foo')"));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(typeof body.error).toBe("string");
  });

  it("a non-Error thrown value is logged and returns a generic message instead of the raw value", async () => {
    handleApiError("some string was thrown");
    expect(errorSpy).toHaveBeenCalled();

    const res = handleApiError("some string was thrown");
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toBe("Unexpected server error");
  });
});
