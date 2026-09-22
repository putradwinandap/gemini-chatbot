import { describe, expect, it } from "vitest";
import { chatRequestSchema, MAX_REQUEST_BYTES } from "@/lib/validation";

const validRequest = {
  messages: [
    {
      id: "message-1",
      role: "user",
      content: "Halo",
      createdAt: "2026-09-22T00:00:00.000Z",
    },
  ],
  systemInstructionId: "general",
};

describe("chatRequestSchema", () => {
  it("accepts the public chat request contract", () => {
    expect(chatRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects empty content, invalid roles, and oversized chains", () => {
    expect(chatRequestSchema.safeParse({ ...validRequest, messages: [] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ ...validRequest, messages: [{ ...validRequest.messages[0], content: " " }] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ ...validRequest, messages: [{ ...validRequest.messages[0], role: "system" }] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ ...validRequest, previousId: "x".repeat(501) }).success).toBe(false);
  });

  it("defines a bounded request size for the route", () => {
    expect(MAX_REQUEST_BYTES).toBe(256_000);
  });
});
