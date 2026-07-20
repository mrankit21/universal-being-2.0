import { describe, it, expect, beforeEach, vi } from "vitest";

// whitelist.ts reads process.env at *module load time*, so each test that
// needs a different env value must reset modules and re-import.
async function loadWhitelist(env: { ip?: string; mobile?: string }) {
  vi.resetModules();
  if (env.ip === undefined) delete process.env.RATE_LIMIT_IP_WHITELIST;
  else process.env.RATE_LIMIT_IP_WHITELIST = env.ip;
  if (env.mobile === undefined) delete process.env.RATE_LIMIT_MOBILE_WHITELIST;
  else process.env.RATE_LIMIT_MOBILE_WHITELIST = env.mobile;
  return import("./whitelist");
}

describe("rate-limit whitelist", () => {
  beforeEach(() => {
    delete process.env.RATE_LIMIT_IP_WHITELIST;
    delete process.env.RATE_LIMIT_MOBILE_WHITELIST;
  });

  it("nothing is whitelisted when the env vars are unset", async () => {
    const { isIpWhitelisted, isMobileWhitelisted } = await loadWhitelist({});
    expect(isIpWhitelisted("1.2.3.4")).toBe(false);
    expect(isMobileWhitelisted("+911234567890")).toBe(false);
  });

  it("parses a comma-separated list and trims whitespace", async () => {
    const { isIpWhitelisted } = await loadWhitelist({ ip: " 1.2.3.4 , 5.6.7.8," });
    expect(isIpWhitelisted("1.2.3.4")).toBe(true);
    expect(isIpWhitelisted("5.6.7.8")).toBe(true);
    expect(isIpWhitelisted("9.9.9.9")).toBe(false);
  });

  it("ignores empty entries from trailing/double commas", async () => {
    const { isIpWhitelisted } = await loadWhitelist({ ip: "1.2.3.4,,  ," });
    expect(isIpWhitelisted("1.2.3.4")).toBe(true);
    expect(isIpWhitelisted("")).toBe(false);
  });

  it("keeps the IP and mobile whitelists independent", async () => {
    const { isIpWhitelisted, isMobileWhitelisted } = await loadWhitelist({
      ip: "1.2.3.4",
      mobile: "+911234567890",
    });
    expect(isIpWhitelisted("+911234567890")).toBe(false);
    expect(isMobileWhitelisted("1.2.3.4")).toBe(false);
    expect(isMobileWhitelisted("+911234567890")).toBe(true);
  });
});
