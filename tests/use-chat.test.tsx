import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY } from "@/lib/storage";
import { useChat } from "@/features/chat/use-chat";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("useChat", () => {
  it("preserves the room history and provider chain when instruction changes", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        activeRoomId: "room-1",
        rooms: [
          {
            roomId: "room-1",
            title: "Existing room",
            systemInstructionId: "general",
            previousId: "interaction-1",
            messages: [
              {
                id: "message-1",
                role: "user",
                content: "Halo",
                createdAt: "2026-09-22T00:00:00.000Z",
              },
            ],
            createdAt: "2026-09-22T00:00:00.000Z",
            updatedAt: "2026-09-22T00:00:00.000Z",
          },
        ],
      }),
    );

    const { result } = renderHook(() => useChat());

    await waitFor(() => expect(result.current.activeRoom?.roomId).toBe("room-1"));
    act(() => result.current.changeRoomInstruction("room-1", "coding"));

    expect(result.current.activeRoom).toMatchObject({
      systemInstructionId: "coding",
      previousId: "interaction-1",
      messages: [{ content: "Halo" }],
    });
  });

  it("appends the provider response and persists its next chain id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: {
          id: "assistant-1",
          role: "assistant",
          content: "Hai juga",
          createdAt: "2026-09-22T00:00:01.000Z",
        },
        previousId: "interaction-1",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChat());
    act(() => result.current.createRoom());

    await waitFor(() => expect(result.current.activeRoom).not.toBeNull());
    await act(async () => {
      await result.current.sendMessage("Halo");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.activeRoom).toMatchObject({
      previousId: "interaction-1",
      messages: [
        { role: "user", content: "Halo" },
        { role: "assistant", content: "Hai juga" },
      ],
    });
  });

  it("does not append a malformed provider response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { role: "assistant", content: "missing id" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChat());
    act(() => result.current.createRoom());
    await waitFor(() => expect(result.current.activeRoom).not.toBeNull());
    await act(async () => {
      await result.current.sendMessage("Halo");
    });

    expect(result.current.activeRoom?.messages).toHaveLength(1);
    expect(result.current.error).toBe("Respons server tidak valid.");
  });
});
