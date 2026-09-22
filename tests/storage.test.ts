import { describe, expect, it } from "vitest";
import {
  emptyStorage,
  MAX_MESSAGES,
  MAX_ROOMS,
  readStorage,
  STORAGE_KEY,
  writeStorage,
} from "@/lib/storage";

describe("storage", () => {
  const message = (id: number) => ({
    id: String(id),
    role: "user" as const,
    content: `message ${id}`,
    createdAt: "2026-09-22T00:00:00.000Z",
  });

  const room = (id: number, messages = [message(id)]) => ({
    roomId: String(id),
    title: `Room ${id}`,
    systemInstructionId: "general" as const,
    messages,
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
  });

  it("creates versioned empty state", () => expect(emptyStorage()).toEqual({ schemaVersion: 1, activeRoomId: null, rooms: [] }));

  it("falls back safely for corrupt or incompatible local storage", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(readStorage()).toEqual(emptyStorage());

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, rooms: [] }));
    expect(readStorage()).toEqual(emptyStorage());
  });

  it("limits persisted rooms and keeps the newest messages", () => {
    writeStorage({
      schemaVersion: 1,
      activeRoomId: "0",
      rooms: Array.from({ length: MAX_ROOMS + 1 }, (_, index) =>
        room(index, Array.from({ length: MAX_MESSAGES + 1 }, (_, messageIndex) => message(messageIndex))),
      ),
    });

    const stored = readStorage();
    expect(stored.rooms).toHaveLength(MAX_ROOMS);
    expect(stored.rooms[0].messages).toHaveLength(MAX_MESSAGES);
    expect(stored.rooms[0].messages[0].id).toBe("1");
  });

  it("filters malformed rooms and messages", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      activeRoomId: "missing",
      rooms: [
        { roomId: "valid", title: "Valid", systemInstructionId: "general", createdAt: "2026-09-22T00:00:00.000Z", updatedAt: "2026-09-22T00:00:00.000Z", messages: [message(1), { broken: true }] },
        { malformed: true },
      ],
    }));

    expect(readStorage()).toMatchObject({ activeRoomId: "valid", rooms: [{ roomId: "valid", messages: [{ id: "1" }] }] });
  });
});
