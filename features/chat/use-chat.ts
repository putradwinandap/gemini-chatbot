"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoom as makeRoom, emptyStorage, readStorage, writeStorage } from "@/lib/storage";
import { chatResponseSchema } from "@/lib/validation";
import type { ChatMessage, ChatRoom, SystemInstructionId } from "@/types/chat";
export function useChat() {
  const [storage, setStorage] = useState(emptyStorage); const [hydrated, setHydrated] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  // Browser storage is an external client-only source; hydrate it after the first render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setStorage(readStorage()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) writeStorage(storage); }, [hydrated, storage]);
  const activeRoom = useMemo(() => storage.rooms.find((room) => room.roomId === storage.activeRoomId) ?? null, [storage]);
  const update = useCallback((fn: (s: typeof storage) => typeof storage) => setStorage((current) => fn(current)), []);
  const createRoom = useCallback((instruction: SystemInstructionId = "general") => { const room = makeRoom(instruction); update((s) => ({ ...s, activeRoomId: room.roomId, rooms: [room, ...s.rooms].slice(0, 30) })); }, [update]);
  const selectRoom = (roomId: string) => update((s) => ({ ...s, activeRoomId: roomId }));
  const renameRoom = (roomId: string, title: string) => update((s) => ({ ...s, rooms: s.rooms.map((r) => r.roomId === roomId ? { ...r, title: title.trim() || "New chat", updatedAt: new Date().toISOString() } : r) }));
  const deleteRoom = (roomId: string) => update((s) => { const rooms = s.rooms.filter((r) => r.roomId !== roomId); return { ...s, rooms, activeRoomId: s.activeRoomId === roomId ? (rooms[0]?.roomId ?? null) : s.activeRoomId }; });
  const changeRoomInstruction = (roomId: string, systemInstructionId: SystemInstructionId) => update((s) => ({ ...s, rooms: s.rooms.map((r) => r.roomId === roomId ? { ...r, systemInstructionId, updatedAt: new Date().toISOString() } : r) }));
  const sendMessage = async (content: string) => { if (!activeRoom || !content.trim() || loading) return; const user: ChatMessage = { id: crypto.randomUUID(), role: "user", content: content.trim(), createdAt: new Date().toISOString() }; const room = { ...activeRoom, messages: [...activeRoom.messages, user], updatedAt: new Date().toISOString() }; update((s) => ({ ...s, rooms: s.rooms.map((r) => r.roomId === room.roomId ? room : r) })); setLoading(true); setError(null); try { const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: room.messages, systemInstructionId: room.systemInstructionId, previousId: room.previousId }) }); const data: unknown = await response.json(); if (!response.ok) throw new Error((data as { error?: { message?: string } }).error?.message ?? "Request gagal"); const parsed = chatResponseSchema.safeParse(data); if (!parsed.success) throw new Error("Respons server tidak valid."); update((s) => ({ ...s, rooms: s.rooms.map((r) => r.roomId === room.roomId ? { ...r, messages: [...r.messages, parsed.data.message], previousId: parsed.data.previousId, updatedAt: new Date().toISOString(), title: r.messages.length === 0 ? user.content.slice(0, 40) : r.title } : r) })); } catch (e) { setError(e instanceof Error ? e.message : "Chat gagal"); } finally { setLoading(false); } };
  return { ...storage, activeRoom, hydrated, loading, error, createRoom, selectRoom, renameRoom, deleteRoom, changeRoomInstruction, sendMessage, clearError: () => setError(null) };
}
