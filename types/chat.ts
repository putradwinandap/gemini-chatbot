export type MessageRole = "user" | "assistant";
export type SystemInstructionId = "general" | "coding" | "travel" | "casual" | "writing" | "study";
export type ChatMessage = { id: string; role: MessageRole; content: string; createdAt: string; error?: boolean };
export type ChatRoom = { roomId: string; title: string; systemInstructionId: SystemInstructionId; messages: ChatMessage[]; previousId?: string; createdAt: string; updatedAt: string };
export type ChatStorage = { schemaVersion: 1; activeRoomId: string | null; rooms: ChatRoom[] };
export type ChatRequest = { messages: ChatMessage[]; systemInstructionId: SystemInstructionId; previousId?: string };
export type ChatResponse = { message: ChatMessage; previousId?: string };
