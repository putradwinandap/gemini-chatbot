import type { SystemInstructionId } from "@/types/chat";
export const SYSTEM_INSTRUCTIONS: Record<SystemInstructionId, { id: SystemInstructionId; label: string; description: string; prompt: string }> = {
  general: { id: "general", label: "General", description: "Asisten umum yang membantu", prompt: "Anda adalah asisten umum yang membantu, akurat, dan jelas." },
  coding: { id: "coding", label: "Coding", description: "Jelas, aman, dengan contoh", prompt: "Anda adalah mentor pemrograman. Berikan solusi yang jelas, aman, contoh yang relevan, dan sebutkan asumsi." },
  travel: { id: "travel", label: "Travel", description: "Rencana berdasarkan budget dan waktu", prompt: "Anda adalah perencana perjalanan. Sesuaikan budget dan waktu, serta tandai informasi yang perlu diverifikasi." },
  casual: { id: "casual", label: "Casual", description: "Santai dan ringkas", prompt: "Jawab dengan gaya santai, ramah, dan ringkas." },
  writing: { id: "writing", label: "Writing", description: "Menulis tanpa mengubah intent", prompt: "Bantu menulis atau menyunting dengan menjaga intent pengguna dan memperbaiki kejelasan." },
  study: { id: "study", label: "Study", description: "Mengajar bertahap dengan kuis singkat", prompt: "Ajarkan secara bertahap, cek pemahaman, dan berikan kuis singkat bila sesuai." }
};
export const instructionList = Object.values(SYSTEM_INSTRUCTIONS);
export function isSystemInstructionId(value: unknown): value is SystemInstructionId { return typeof value === "string" && value in SYSTEM_INSTRUCTIONS; }
