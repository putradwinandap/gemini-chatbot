import type { ChatRequest } from "@/types/chat";

type ProviderResult = {
  interactionId?: string | null;
  text?: string;
};

type GenerateText = (
  prompt: string,
  config: {
    previousInteractionId?: string;
    systemInstruction: string;
    signal?: AbortSignal;
  },
) => Promise<ProviderResult>;

export async function generateWithGemini(
  input: ChatRequest & { systemInstruction: string },
): Promise<{ text: string; previousId?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Provider belum dikonfigurasi");
  }

  const provider = (await import("gemini-flash-api")) as {
    generateText?: GenerateText;
  };

  if (!provider.generateText) {
    throw new Error("Provider adapter tidak tersedia");
  }

  const prompt = input.messages.at(-1)?.content.trim();
  if (!prompt) {
    throw new Error("Pesan terakhir tidak tersedia");
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("Provider timeout"));
    }, 30_000);
  });

  try {
    const result = await Promise.race([
      provider.generateText(prompt, {
        systemInstruction: input.systemInstruction,
        previousInteractionId: input.previousId,
        signal: controller.signal,
      }),
      timeout,
    ]);
    const text = result.text?.trim();

    if (!text) {
      throw new Error("Provider mengembalikan respons kosong");
    }

    return { text, previousId: result.interactionId ?? undefined };
  } finally {
    controller.abort();
    if (timeoutId) clearTimeout(timeoutId);
  }
}
