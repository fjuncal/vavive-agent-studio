"use client";

import clsx from "clsx";
import { UserRound } from "lucide-react";
import { memo } from "react";
import type { ConversationSummary } from "@/lib/api";
import { ContactAvatar, displayCustomerName } from "@/components/ContactAvatar";

function formatListTime(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("pt-BR", sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit" }).format(date);
}

function statusLabel(conversation: ConversationSummary) {
  if (conversation.humanTakeoverActive) {
    return conversation.responsibleUserName || "Atendimento humano";
  }
  if (conversation.operationalStatus === "concluida" || conversation.operationalStatus === "venda_concluida") {
    return "Conversa encerrada";
  }
  return "IA atendendo";
}

export const ConversationListItem = memo(function ConversationListItem({
  conversation,
  isSelected,
  humanUnreadCount,
  disabled,
  onSelect
}: {
  conversation: ConversationSummary;
  isSelected: boolean;
  humanUnreadCount: number;
  disabled?: boolean;
  onSelect: (conversation: ConversationSummary) => void;
}) {
  const unread = Math.max(humanUnreadCount, 0);
  const isHuman = conversation.humanTakeoverActive;
  const isClosed = conversation.operationalStatus === "concluida" || conversation.operationalStatus === "venda_concluida";
  const timestamp = conversation.lastMessageAt || conversation.updatedAt;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      disabled={disabled}
      aria-current={isSelected ? "true" : undefined}
      className={clsx(
        "group relative mb-0.5 flex min-w-0 w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-150",
        isSelected ? "bg-brand-100/75 dark:bg-brand-900/30" : unread > 0 ? "bg-white dark:bg-slate-800/60" : "hover:bg-white/90 dark:hover:bg-slate-800/50",
        disabled && "cursor-wait opacity-70"
      )}
    >
      {isSelected ? <span className="absolute inset-y-3 left-0 w-0.5 rounded-r bg-brand-600" aria-hidden="true" /> : null}
      <ContactAvatar name={conversation.customerName} src={conversation.customerPicture} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className={clsx("min-w-0 truncate text-sm text-text-primary", unread > 0 || isSelected ? "font-semibold" : "font-medium")}>
            {displayCustomerName(conversation.customerName)}
          </span>
          <time className="shrink-0 text-2xs text-text-tertiary" dateTime={timestamp || undefined}>
            {formatListTime(timestamp)}
          </time>
        </span>

        <span className="mt-1 flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-xs text-text-secondary">
            {conversation.lastResponse || conversation.firstPrompt || "Sem mensagens"}
          </span>
          {unread > 0 ? (
            <span
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold tabular-nums text-white shadow-sm"
              aria-label={`${unread} novas mensagens`}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </span>

        <span className="mt-1.5 flex items-center gap-1.5 text-[10px] text-text-tertiary">
          <span className={clsx("h-1.5 w-1.5 rounded-full", isHuman ? "bg-amber-500" : isClosed ? "bg-slate-400" : "bg-brand-500")} aria-hidden="true" />
          {isHuman ? <UserRound size={12} aria-hidden="true" /> : null}
          <span className={isHuman ? "text-amber-700 dark:text-amber-400" : undefined}>{statusLabel(conversation)}</span>
        </span>
      </span>
    </button>
  );
});
