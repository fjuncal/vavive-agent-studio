"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import {
  completeConversation,
  getConversationMessages,
  getConversations,
  getFranchises,
  sendConversationManualMessage,
  startHumanTakeover,
  stopHumanTakeover,
  testAgentConversation,
  type ConversationMessage,
  type ConversationSummary,
  type FranchiseSummary
} from "@/lib/api";
import { Bot, Building2, CheckCircle2, ChevronDown, Loader2, MessageSquareText, Phone, Send, UserRound, X } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const MESSAGE_PAGE_SIZE = 30;
const LOAD_OLDER_THRESHOLD_PX = 120;

function formatDate(value?: string | null) {
  if (!value) {
    return "Agora";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function normalizeTimestamp(value?: number | null) {
  if (!value) {
    return null;
  }
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function formatMessageTime(value?: number | null) {
  const timestamp = normalizeTimestamp(value);
  if (!timestamp) {
    return "";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function titleizeDayLabel(label: string) {
  return label.replace(/(^|[-\s])\p{L}/gu, (segment) => segment.toUpperCase());
}

function formatMessageDayLabel(value?: number | null) {
  const timestamp = normalizeTimestamp(value);
  if (!timestamp) {
    return "Sem data";
  }

  const messageDate = new Date(timestamp);
  const now = new Date();
  if (isSameDay(messageDate, now)) {
    return "Hoje";
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(messageDate, yesterday)) {
    return "Ontem";
  }

  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(messageDate);
  if (Math.abs(now.getTime() - messageDate.getTime()) < 7 * 24 * 60 * 60 * 1000) {
    return titleizeDayLabel(weekday);
  }

  return `${titleizeDayLabel(weekday)} Â· ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(messageDate)}`;
}

function formatConversationDayLabel(value?: number | null) {
  const timestamp = normalizeTimestamp(value);
  if (!timestamp) {
    return "Sem data";
  }

  const messageDate = new Date(timestamp);
  const now = new Date();
  if (isSameDay(messageDate, now)) {
    return "Hoje";
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(messageDate, yesterday)) {
    return "Ontem";
  }

  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(messageDate);
  if (Math.abs(now.getTime() - messageDate.getTime()) < 7 * 24 * 60 * 60 * 1000) {
    return titleizeDayLabel(weekday);
  }

  return `${titleizeDayLabel(weekday)} · ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(messageDate)}`;
}

function sortConversationsByRecent(items: ConversationSummary[]) {
  return [...items].sort((left, right) => {
    const leftValue = new Date(left.lastMessageAt || left.updatedAt || left.createdAt).getTime();
    const rightValue = new Date(right.lastMessageAt || right.updatedAt || right.createdAt).getTime();
    return rightValue - leftValue;
  });
}

function displayCustomerName(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.toLowerCase() !== "desconhecido" ? trimmed : "Contato sem nome";
}

function contactInitials(value?: string | null) {
  const name = displayCustomerName(value);
  if (name === "Contato sem nome") return null;
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function ContactAvatar({ name, src, size = "md" }: { name?: string | null; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClass = size === "lg" ? "h-12 w-12 text-sm" : size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-xs";
  const initials = contactInitials(name);

  useEffect(() => setImageFailed(false), [src]);

  if (src && !imageFailed) {
    return <img src={src} alt="" className={`${sizeClass} shrink-0 rounded-full object-cover ring-1 ring-black/5`} onError={() => setImageFailed(true)} />;
  }

  return (
    <span className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-200`} aria-hidden="true">
      {initials || <UserRound size={size === "lg" ? 20 : 16} />}
    </span>
  );
}

function conversationStatusLabel(status?: string | null) {
  switch (status?.toLowerCase()) {
    case "em_atendimento_humano": return "Atendimento humano";
    case "concluida": return "Conversa encerrada";
    case "venda_concluida": return "Venda concluída";
    default: return "IA atendendo";
  }
}

function messageIdentity(message: ConversationMessage) {
  return message.id || [message.time, message.role, message.type, message.text].join(":");
}

function prependAndSortMessages(current: ConversationMessage[], older: ConversationMessage[]) {
  const unique = new Map<string, ConversationMessage>();
  [...older, ...current].forEach((message) => unique.set(messageIdentity(message), message));
  return Array.from(unique.values()).sort((left, right) => {
    const leftTime = normalizeTimestamp(left.time) ?? 0;
    const rightTime = normalizeTimestamp(right.time) ?? 0;
    return leftTime - rightTime;
  });
}

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "aguardando_ia", label: "Aguardando IA" },
  { value: "em_atendimento_humano", label: "Humano" },
  { value: "concluida", label: "Concluida" },
  { value: "venda_concluida", label: "Venda concluida" }
];

export default function ConversationsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [testPrompt, setTestPrompt] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [saleSummary, setSaleSummary] = useState("");
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentMessagePage, setCurrentMessagePage] = useState(1);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadedMessagePagesRef = useRef(new Set<number>());
  const currentMessagePageRef = useRef(1);
  const hasMoreMessagesRef = useRef(false);
  const messageRequestInFlightRef = useRef(false);
  const messageLoadGenerationRef = useRef(0);
  const initializedConversationRef = useRef<string | null>(null);
  const pendingScrollAdjustmentRef = useRef<{ height: number; top: number } | "bottom" | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (isSuperAdmin) {
      getFranchises()
        .then((items) => {
          setFranchises(items);
          if (!selectedFranchiseId && items[0]?.id) {
            setSelectedFranchiseId(items[0].id);
          }
        })
        .catch(() => setFranchises([]));
    } else if (user.franchise?.id) {
      setSelectedFranchiseId(user.franchise.id);
      setFranchises([user.franchise]);
    }
  }, [isSuperAdmin, selectedFranchiseId, user]);

  async function loadConversations() {
    if (!user) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const items = sortConversationsByRecent(await getConversations({
        franchiseId: isSuperAdmin ? selectedFranchiseId || undefined : undefined,
        status: selectedStatus || undefined
      }));
      setConversations(items);
      setSelectedConversationId((current) => {
        if (current && items.some((item) => item.id === current)) {
          return current;
        }
        return items[0]?.id || "";
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar conversas.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    void loadConversations();
  }, [selectedFranchiseId, selectedStatus, user]);

  async function loadInitialMessages(conversationId: string) {
    const generation = ++messageLoadGenerationRef.current;
    initializedConversationRef.current = conversationId;
    loadedMessagePagesRef.current = new Set();
    currentMessagePageRef.current = 1;
    hasMoreMessagesRef.current = false;
    messageRequestInFlightRef.current = true;
    pendingScrollAdjustmentRef.current = null;
    setMessages([]);
    setCurrentMessagePage(1);
    setHasMoreMessages(false);
    setIsLoadingMessages(true);
    setIsLoadingOlderMessages(false);
    try {
      const response = await getConversationMessages(conversationId, 1, MESSAGE_PAGE_SIZE);
      if (generation !== messageLoadGenerationRef.current) return;
      loadedMessagePagesRef.current.add(1);
      pendingScrollAdjustmentRef.current = "bottom";
      setMessages(response.items);
      currentMessagePageRef.current = 1;
      hasMoreMessagesRef.current = response.hasMore;
      setCurrentMessagePage(1);
      setHasMoreMessages(response.hasMore);
    } catch {
      if (generation !== messageLoadGenerationRef.current) return;
      setMessages([]);
      hasMoreMessagesRef.current = false;
      setHasMoreMessages(false);
    } finally {
      if (generation === messageLoadGenerationRef.current) {
        messageRequestInFlightRef.current = false;
        setIsLoadingMessages(false);
      }
    }
  }

  async function loadOlderMessages() {
    if (!selectedConversationId || messageRequestInFlightRef.current || !hasMoreMessagesRef.current) return;
    const page = currentMessagePageRef.current + 1;
    if (loadedMessagePagesRef.current.has(page)) return;

    const generation = messageLoadGenerationRef.current;
    const container = messagesContainerRef.current;
    if (container) {
      pendingScrollAdjustmentRef.current = { height: container.scrollHeight, top: container.scrollTop };
    }
    messageRequestInFlightRef.current = true;
    setIsLoadingOlderMessages(true);
    try {
      const response = await getConversationMessages(selectedConversationId, page, MESSAGE_PAGE_SIZE);
      if (generation !== messageLoadGenerationRef.current) return;
      loadedMessagePagesRef.current.add(page);
      currentMessagePageRef.current = page;
      hasMoreMessagesRef.current = response.hasMore;
      setMessages((current) => prependAndSortMessages(current, response.items));
      setCurrentMessagePage(page);
      setHasMoreMessages(response.hasMore);
    } catch {
      pendingScrollAdjustmentRef.current = null;
    } finally {
      if (generation === messageLoadGenerationRef.current) {
        messageRequestInFlightRef.current = false;
        setIsLoadingOlderMessages(false);
      }
    }
  }

  useEffect(() => {
    if (!selectedConversationId) {
      messageLoadGenerationRef.current += 1;
      initializedConversationRef.current = null;
      currentMessagePageRef.current = 1;
      hasMoreMessagesRef.current = false;
      setMessages([]);
      setCurrentMessagePage(1);
      setHasMoreMessages(false);
      return;
    }
    if (initializedConversationRef.current === selectedConversationId) return;
    void loadInitialMessages(selectedConversationId);
  }, [selectedConversationId]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const pending = pendingScrollAdjustmentRef.current;
    if (!container || !pending) return;
    if (pending === "bottom") {
      container.scrollTop = container.scrollHeight;
    } else {
      container.scrollTop = pending.top + (container.scrollHeight - pending.height);
    }
    pendingScrollAdjustmentRef.current = null;
  }, [messages]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );
  const groupedMessages = useMemo(() => {
    const sortedMessages = [...messages].sort((left, right) => {
      const leftTime = normalizeTimestamp(left.time) ?? 0;
      const rightTime = normalizeTimestamp(right.time) ?? 0;
      return leftTime - rightTime;
    });

    return sortedMessages.reduce<Array<{ label: string; items: ConversationMessage[] }>>((groups, message) => {
      const label = formatConversationDayLabel(message.time);
      const currentGroup = groups[groups.length - 1];
      if (!currentGroup || currentGroup.label !== label) {
        groups.push({ label, items: [message] });
      } else {
        currentGroup.items.push(message);
      }
      return groups;
    }, []);
  }, [messages]);
  const isConversationClosed = selectedConversation?.operationalStatus === "concluida" || selectedConversation?.operationalStatus === "venda_concluida";

  async function handleTestAgent() {
    const franchiseId = isSuperAdmin ? selectedFranchiseId : user?.franchise?.id;
    if (!franchiseId || !testPrompt.trim()) {
      setError("Selecione a franquia e escreva a mensagem de teste.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await testAgentConversation({ franchiseId, prompt: testPrompt });
      setTestPrompt("");
      setSuccess("Conversa de teste criada.");
      await loadConversations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar conversa de teste.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runAction(action: () => Promise<{ message: string }>) {
    setIsActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await action();
      setSuccess(result.message);
      setManualMessage("");
      setSaleSummary("");
      await loadConversations();
      if (selectedConversationId) {
        await loadInitialMessages(selectedConversationId);
      }
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel concluir a acao.");
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleCompleteSale() {
    if (!selectedConversation || !saleSummary.trim()) return;
    const completed = await runAction(() => completeConversation(selectedConversation.id, {
      outcome: "VENDA_CONCLUIDA",
      closedReason: "Venda fechada",
      saleSummary
    }));
    if (completed) setIsSaleDialogOpen(false);
  }

  return (
    <AppShell wide>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Atendimento"
          title="Conversas"
          description={isSuperAdmin ? "Atendimento das franquias em uma unica fila." : "Atenda clientes da sua franquia em tempo real."}
        />
        {isSuperAdmin ? (
          <details className="group relative self-start lg:self-end">
            <summary className="btn-secondary cursor-pointer list-none px-3 py-2 text-xs">
              <Send size={14} />
              Ferramentas de teste
              <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 z-20 mt-2 grid w-[min(20rem,calc(100vw-2rem))] gap-3 rounded-2xl border bg-bg-primary p-4 shadow-soft-lg" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <p className="text-sm font-semibold text-text-primary">Nova conversa de teste</p>
                <p className="mt-1 text-xs leading-5 text-text-secondary">Abra uma conversa GPTMaker sem ocupar a fila de contatos.</p>
              </div>
              <textarea className="input-field min-h-20" placeholder="Mensagem inicial do cliente" value={testPrompt} onChange={(event) => setTestPrompt(event.target.value)} />
              <button type="button" onClick={() => void handleTestAgent()} disabled={isSubmitting} className="btn-primary w-full py-2 text-xs">
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Criar conversa
              </button>
            </div>
          </details>
        ) : null}
      </div>

      {error ? <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{success}</p> : null}

      <section className="grid min-w-0 items-start gap-4 overflow-x-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="grid min-w-0 gap-4 lg:sticky lg:top-20 lg:self-start">
          {isSuperAdmin ? (
            <section className="card overflow-hidden p-4">
              <select className="input-field" aria-label="Franquia" value={selectedFranchiseId} onChange={(event) => setSelectedFranchiseId(event.target.value)}>
                {franchises.map((franchise) => <option key={franchise.id} value={franchise.id}>{franchise.name}</option>)}
              </select>
            </section>
          ) : null}

          <section className="card min-w-0 overflow-hidden p-4">
            <div className="grid gap-3">
              <select className="input-field" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                {statusOptions.map((status) => (
                  <option key={status.value || "all"} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <p className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando conversas...</p>
            ) : conversations.length ? (
              <div className="mt-3 grid max-h-[calc(100dvh-24rem)] min-h-[18rem] overflow-x-hidden overflow-y-auto scrollbar-thin">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`flex min-w-0 gap-3 border-b px-3 py-3.5 text-left transition-colors ${selectedConversationId === conversation.id ? "bg-brand-50 dark:bg-brand-900/20" : "hover:bg-bg-secondary"}`}
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <ContactAvatar name={conversation.customerName} src={conversation.customerPicture} />
                    <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          {displayCustomerName(conversation.customerName)}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          <Phone size={14} className="shrink-0" />
                          <span className="truncate">{conversation.customerPhone || "Sem telefone"}</span>
                        </div>
                      </div>
                      <span className="shrink-0 text-2xs text-text-tertiary">{formatDate(conversation.lastMessageAt || conversation.updatedAt)}</span>
                    </div>
                    <p className="mt-2 truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {conversation.lastResponse || conversation.firstPrompt || "Sem mensagens."}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-2xs text-text-tertiary">
                      <span className={`h-1.5 w-1.5 rounded-full ${conversation.humanTakeoverActive ? "bg-amber-500" : conversation.operationalStatus === "concluida" || conversation.operationalStatus === "venda_concluida" ? "bg-slate-400" : "bg-brand-500"}`} />
                      {conversationStatusLabel(conversation.operationalStatus)}
                    </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={MessageSquareText} title="Nenhuma conversa" description="Quando houver conversas sincronizadas, elas aparecerao aqui." />
            )}
          </section>
        </aside>

        <section className="card min-w-0 overflow-hidden p-0 lg:h-[calc(100dvh-13.5rem)] lg:min-h-[32rem]">
          {selectedConversation ? (
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
              <div className="grid min-w-0 gap-4 border-b border-line/80 px-4 py-3 sm:px-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <ContactAvatar name={selectedConversation.customerName} src={selectedConversation.customerPicture} size="lg" />
                  <div className="min-w-0">
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {displayCustomerName(selectedConversation.customerName)}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="inline-flex items-center gap-2">
                      <Phone size={14} className="shrink-0" />
                      {selectedConversation.customerPhone || "Sem telefone"}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Building2 size={14} className="shrink-0" />
                      {selectedConversation.franchiseName}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedConversation.operationalStatus} />
                    {selectedConversation.channelType ? <StatusBadge status={selectedConversation.channelType} /> : null}
                    {selectedConversation.humanTakeoverActive ? (
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        {selectedConversation.responsibleUserName ? `Atendimento assumido por ${selectedConversation.responsibleUserName}` : "Atendimento humano ativo"}
                      </span>
                    ) : null}
                  </div>
                  </div>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <button type="button" onClick={() => void runAction(() => startHumanTakeover(selectedConversation.id))} disabled={isActionLoading || selectedConversation.humanTakeoverActive || isConversationClosed} className="btn-secondary px-3 py-2 text-xs disabled:opacity-50">
                    Assumir
                  </button>
                  <button type="button" onClick={() => void runAction(() => stopHumanTakeover(selectedConversation.id))} disabled={isActionLoading || !selectedConversation.humanTakeoverActive || isConversationClosed} className="btn-secondary px-3 py-2 text-xs disabled:opacity-50">
                    Devolver para IA
                  </button>
                  <button type="button" onClick={() => void runAction(() => completeConversation(selectedConversation.id, { outcome: "CONCLUIDA", closedReason: "Atendimento encerrado" }))} disabled={isActionLoading || isConversationClosed} className="btn-ghost px-3 py-2 text-xs disabled:opacity-50">
                    Encerrar
                  </button>
                  <button type="button" onClick={() => setIsSaleDialogOpen(true)} disabled={isActionLoading || isConversationClosed} className="btn-primary px-3 py-2 text-xs disabled:opacity-50">
                    Concluir venda
                  </button>
                </div>
              </div>

              <div className="h-full min-h-0 min-w-0">
                <div className="grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto]">
                  <div
                    ref={messagesContainerRef}
                    onScroll={(event) => {
                      if (event.currentTarget.scrollTop <= LOAD_OLDER_THRESHOLD_PX) {
                        void loadOlderMessages();
                      }
                    }}
                    data-current-page={currentMessagePage}
                    data-has-more={hasMoreMessages}
                    className="grid h-[65dvh] min-h-0 content-start gap-5 overflow-x-hidden overflow-y-auto overscroll-contain bg-bg-secondary px-4 py-5 scrollbar-thin sm:px-6 lg:h-auto"
                  >
                    {isLoadingOlderMessages ? (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                        <Loader2 size={14} className="animate-spin" />
                        Carregando mensagens antigas...
                      </div>
                    ) : null}
                    {isLoadingMessages ? (
                      <div className="flex min-h-[20rem] items-center justify-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        <Loader2 size={16} className="animate-spin" />
                        Carregando mensagens...
                      </div>
                    ) : groupedMessages.length ? (
                      groupedMessages.map((group) => (
                        <section key={group.label} className="grid gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-line/80" />
                            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>
                              {group.label}
                            </p>
                            <div className="h-px flex-1 bg-line/80" />
                          </div>
                          {group.items.map((message) => {
                            const role = message.role?.toUpperCase();
                            const isCustomerMessage = role === "USER";
                            const isHumanMessage = role === "HUMAN";
                            const authorName = isCustomerMessage
                              ? displayCustomerName(selectedConversation.customerName)
                              : isHumanMessage
                                ? message.userName || "Atendimento humano"
                                : message.userName || selectedConversation.agentName || "Assistente Vavive";

                            return (
                              <div key={message.id} className={`flex gap-2 ${isCustomerMessage ? "justify-start" : "justify-end"}`}>
                                {isCustomerMessage ? <ContactAvatar name={selectedConversation.customerName} src={selectedConversation.customerPicture} size="sm" /> : null}
                                <article className={`max-w-[min(82%,44rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-soft-sm ${isCustomerMessage ? "rounded-tl-md bg-bg-primary text-text-primary" : isHumanMessage ? "rounded-tr-md bg-ink text-white" : "rounded-tr-md bg-brand-100 text-brand-900 dark:bg-brand-900/50 dark:text-brand-50"}`}>
                                  <div className="mb-0.5 flex items-center gap-1.5 text-2xs font-medium opacity-70">
                                    {!isCustomerMessage && !isHumanMessage ? <Bot size={12} /> : null}
                                    <span>{isHumanMessage ? `Enviado por ${authorName}` : authorName}</span>
                                    <span aria-hidden="true">·</span>
                                    <time>{formatMessageTime(message.time) || "Agora"}</time>
                                  </div>
                                  <p className="whitespace-pre-wrap break-words">{message.text || ""}</p>
                                </article>
                              </div>
                            );
                          })}
                        </section>
                      ))
                    ) : (
                      <EmptyState icon={MessageSquareText} title="Sem mensagens" description="Nao ha mensagens para esta conversa." />
                    )}
                  </div>

                  <div className="border-t bg-bg-primary p-3 sm:p-4" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-end gap-2 rounded-2xl border bg-bg-secondary p-2" style={{ borderColor: "var(--color-border)" }}>
                      <textarea className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text-primary outline-none" placeholder={selectedConversation.humanTakeoverActive ? "Digite uma mensagem..." : "Assuma o atendimento para responder"} value={manualMessage} disabled={!selectedConversation.humanTakeoverActive || isConversationClosed} onChange={(event) => setManualMessage(event.target.value)} />
                      <button type="button" aria-label="Enviar mensagem" onClick={() => void runAction(() => sendConversationManualMessage(selectedConversation.id, { message: manualMessage }))} disabled={isActionLoading || !manualMessage.trim() || !selectedConversation.humanTakeoverActive || isConversationClosed} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">
                        {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <EmptyState icon={MessageSquareText} title="Selecione uma conversa" description="Escolha uma conversa na lista para abrir a inbox." />
          )}
        </section>
      </section>

      {isSaleDialogOpen && selectedConversation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSaleDialogOpen(false)} />
          <section role="dialog" aria-modal="true" aria-labelledby="sale-dialog-title" className="card relative z-10 w-full max-w-lg p-6 shadow-soft-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="sale-dialog-title" className="text-lg font-semibold text-text-primary">Concluir venda</h2>
                <p className="mt-1 text-sm text-text-secondary">Registre o resumo comercial de {displayCustomerName(selectedConversation.customerName)}.</p>
              </div>
              <button type="button" aria-label="Fechar dialogo" onClick={() => setIsSaleDialogOpen(false)} className="btn-ghost h-9 w-9 p-0"><X size={18} /></button>
            </div>
            <textarea autoFocus className="input-field mt-5 min-h-36" placeholder="Resumo da venda" value={saleSummary} onChange={(event) => setSaleSummary(event.target.value)} />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setIsSaleDialogOpen(false)}>Cancelar</button>
              <button type="button" className="btn-primary" disabled={isActionLoading || !saleSummary.trim()} onClick={() => void handleCompleteSale()}>
                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Confirmar venda
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
