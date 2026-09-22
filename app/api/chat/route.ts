import { NextResponse } from "next/server";
import { SYSTEM_INSTRUCTIONS, isSystemInstructionId } from "@/constants/instructions";
import { generateWithGemini } from "@/lib/gemini-adapter";
import { chatRequestSchema, MAX_REQUEST_BYTES } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

function getClientId(request: Request): string {
  if (process.env.TRUST_PROXY !== "true") return "anonymous";
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "anonymous";
}

function getProviderStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as { status?: unknown; statusCode?: unknown };
  return typeof candidate.statusCode === "number"
    ? candidate.statusCode
    : typeof candidate.status === "number"
      ? candidate.status
      : undefined;
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Payload terlalu besar." } }, { status: 413 });
    }
    if (!checkRateLimit(getClientId(request))) {
      return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi." } }, { status: 429 });
    }
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Payload terlalu besar." } }, { status: 413 });
    }
    let json: unknown;
    try { json = JSON.parse(body); } catch { return NextResponse.json({ error: { code: "INVALID_PAYLOAD", message: "Pesan atau instruction tidak valid." } }, { status: 400 }); }
    const parsed = chatRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_PAYLOAD", message: "Pesan atau instruction tidak valid." } },
        { status: 400 },
      );
    }
    if (!isSystemInstructionId(parsed.data.systemInstructionId)) {
      return NextResponse.json(
        { error: { code: "INVALID_INSTRUCTION", message: "Instruction tidak valid." } },
        { status: 400 },
      );
    }
    const result = await generateWithGemini({ ...parsed.data, systemInstructionId: parsed.data.systemInstructionId, systemInstruction: SYSTEM_INSTRUCTIONS[parsed.data.systemInstructionId].prompt });
    return NextResponse.json({ message: { id: crypto.randomUUID(), role: "assistant", content: result.text, createdAt: new Date().toISOString() }, previousId: result.previousId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const isTimeout = message.toLowerCase().includes("timeout");
    const isRateLimited = getProviderStatus(error) === 429;
    console.error("chat route error", { code: isTimeout ? "PROVIDER_TIMEOUT" : isRateLimited ? "RATE_LIMITED" : "CHAT_FAILED" });
    return NextResponse.json(
      {
        error: {
          code: isTimeout ? "PROVIDER_TIMEOUT" : isRateLimited ? "RATE_LIMITED" : "CHAT_FAILED",
          message: isTimeout
            ? "Provider terlalu lama merespons. Coba lagi."
            : isRateLimited
              ? "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi."
              : "Chat gagal diproses. Coba lagi.",
        },
      },
      { status: isTimeout ? 504 : isRateLimited ? 429 : 500 },
    );
  }
}
