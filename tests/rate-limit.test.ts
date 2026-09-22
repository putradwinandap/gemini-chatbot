import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, resetRateLimitForTests } from "@/lib/rate-limit";

afterEach(() => resetRateLimitForTests());

describe("rate limit", () => {
  it("allows the configured burst and rejects the next request", () => {
    for (let index = 0; index < RATE_LIMIT_MAX; index += 1) expect(checkRateLimit("client", 1_000)).toBe(true);
    expect(checkRateLimit("client", 1_000)).toBe(false);
  });

  it("allows requests after the sliding window expires", () => {
    for (let index = 0; index < RATE_LIMIT_MAX; index += 1) checkRateLimit("client", 1_000);
    expect(checkRateLimit("client", 1_000 + RATE_LIMIT_WINDOW_MS + 1)).toBe(true);
  });
});
