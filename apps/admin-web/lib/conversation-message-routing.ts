import type { ConversationSummary } from "./api";

export type ConversationMessageTarget =
  | { type: "local"; id: string }
  | { type: "remote"; chatId: string };

/** Reading a chat uses a local UUID only after operational materialization. */
export function resolveConversationMessageTarget(
  conversation: Pick<ConversationSummary, "id" | "chatId">
): ConversationMessageTarget | null {
  const localConversationId = conversation.id?.trim();
  if (localConversationId) {
    return { type: "local", id: localConversationId };
  }

  const remoteChatId = conversation.chatId?.trim();
  return remoteChatId ? { type: "remote", chatId: remoteChatId } : null;
}
