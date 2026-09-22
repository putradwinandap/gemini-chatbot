import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateWithGemini } = vi.hoisted(() => ({ generateWithGemini: vi.fn() }));

vi.mock("@/lib/gemini-adapter", () => ({ generateWithGemini }));

import { POST } from "@/app/api/chat/route";

const requestBody = {
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

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
  );

describe("POST /api/chat", () => {
  beforeEach(() => {
    generateWithGemini.mockReset();
  });

  it("rejects malformed payloads and unknown instructions", async () => {
    const malformed = await post({});
    expect(malformed.status).toBe(400);
    expect((await malformed.json()).error.code).toBe("INVALID_PAYLOAD");

    const unknown = await post({ ...requestBody, systemInstructionId: "unknown" });
    expect(unknown.status).toBe(400);
    expect((await unknown.json()).error.code).toBe("INVALID_INSTRUCTION");
  });

  it("forwards the selected prompt and provider chain", async () => {
    generateWithGemini.mockResolvedValue({ text: "Hai juga", previousId: "interaction-2" });

    const response = await post({ ...requestBody, previousId: "interaction-1" });

    expect(response.status).toBe(200);
    expect(generateWithGemini).toHaveBeenCalledWith(
      expect.objectContaining({
        previousId: "interaction-1",
        systemInstructionId: "general",
        systemInstruction: expect.any(String),
      }),
    );
    expect(await response.json()).toMatchObject({
      message: { role: "assistant", content: "Hai juga" },
      previousId: "interaction-2",
    });
  });

  it("returns a safe timeout response", async () => {
    generateWithGemini.mockRejectedValue(new Error("Provider timeout"));

    const response = await post(requestBody);

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      error: { code: "PROVIDER_TIMEOUT", message: "Provider terlalu lama merespons. Coba lagi." },
    });
  });

  it("returns a safe rate-limit response", async () => {
    generateWithGemini.mockRejectedValue(Object.assign(new Error("Too many requests"), { statusCode: 429 }));

    const response = await post(requestBody);

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: { code: "RATE_LIMITED", message: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi." },
    });
  });
});
