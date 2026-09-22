import { z } from "zod";

const chatMessageSchema = z.object({
  id: z.string().min(1).max(200),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(20_000),
  createdAt: z.string().datetime(),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(200),
  systemInstructionId: z.string().min(1).max(100),
  previousId: z.string().min(1).max(500).optional(),
});

export const chatResponseSchema = z.object({
  message: chatMessageSchema,
  previousId: z.string().min(1).max(500).optional(),
});

export const MAX_REQUEST_BYTES = 256_000;
