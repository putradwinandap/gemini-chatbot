import type { ChatRoom, ChatStorage, SystemInstructionId } from "@/types/chat";
import { isSystemInstructionId } from "@/constants/instructions";
export const STORAGE_KEY = "gemini-chat-history";
export const MAX_ROOMS = 30;
export const MAX_MESSAGES = 200;
export const emptyStorage = (): ChatStorage => ({ schemaVersion: 1, activeRoomId: null, rooms: [] });
export function createRoom(systemInstructionId: SystemInstructionId = "general"): ChatRoom { const now = new Date().toISOString(); return { roomId: crypto.randomUUID(), title: "New chat", systemInstructionId, messages: [], createdAt: now, updatedAt: now }; }
function isMessage(value: unknown): value is ChatRoom["messages"][number] { if (typeof value !== "object" || value === null) return false; const message = value as Record<string, unknown>; return typeof message.id === "string" && message.id.length > 0 && message.id.length <= 200 && (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.trim().length > 0 && message.content.length <= 20_000 && typeof message.createdAt === "string" && !Number.isNaN(Date.parse(message.createdAt)); }
function isRoom(value: unknown): value is ChatRoom { if (typeof value !== "object" || value === null) return false; const room = value as Record<string, unknown>; return typeof room.roomId === "string" && typeof room.title === "string" && isSystemInstructionId(room.systemInstructionId) && typeof room.createdAt === "string" && typeof room.updatedAt === "string" && Array.isArray(room.messages); }
export function readStorage(): ChatStorage { if (typeof window === "undefined") return emptyStorage(); try { const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<ChatStorage>; if (parsed?.schemaVersion !== 1 || !Array.isArray(parsed.rooms)) return emptyStorage(); const rooms = parsed.rooms.filter(isRoom).slice(0, MAX_ROOMS).map((room) => ({ ...room, messages: room.messages.filter(isMessage).slice(-MAX_MESSAGES), previousId: typeof room.previousId === "string" && room.previousId.length <= 500 ? room.previousId : undefined })); return { schemaVersion: 1, activeRoomId: typeof parsed.activeRoomId === "string" && rooms.some((room) => room.roomId === parsed.activeRoomId) ? parsed.activeRoomId : rooms[0]?.roomId ?? null, rooms }; } catch { return emptyStorage(); } }
export function writeStorage(storage: ChatStorage): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...storage,
        rooms: storage.rooms.slice(0, MAX_ROOMS).map((room) => ({
          ...room,
          messages: room.messages.slice(-MAX_MESSAGES),
        })),
      }),
    );
  } catch {
    // Storage can be unavailable or full; the in-memory conversation remains usable.
  }
}
