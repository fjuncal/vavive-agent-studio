import type { ConversationSummary } from "./api";

export function normalizeConversationSearch(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function conversationMatchesSearch(
  conversation: Pick<ConversationSummary, "customerName" | "customerPhone">,
  query: string
) {
  const normalizedQuery = normalizeConversationSearch(query);
  if (!normalizedQuery) {
    return true;
  }
  const normalizedName = normalizeConversationSearch(conversation.customerName);
  if (normalizedQuery.split(/\s+/).every((token) => normalizedName.includes(token))) {
    return true;
  }
  const queryDigits = query.replace(/\D/g, "");
  return queryDigits.length > 0 && (conversation.customerPhone ?? "").replace(/\D/g, "").includes(queryDigits);
}
