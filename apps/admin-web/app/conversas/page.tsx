"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { resolveConversationMessageTarget } from "@/lib/conversation-message-routing";
import {
  completeConversation,
  getConversationPage,
  getConversationMessages,
  getRemoteConversationMessages,
  getFranchises,
  materializeConversation,
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
const CONVERSATION_PAGE_SIZE = 50;
const POLLING_INTERVAL_MS = 10_000;
const POLLING_MAX_BACKOFF_MS = 60_000;
const LOAD_OLDER_THRESHOLD_PX = 120;
const LOAD_NEWER_CONVERSATIONS_THRESHOLD_PX = 160;
const LOAD_NEWER_MESSAGES_THRESHOLD_PX = 160;

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

function sameConversationSummary(left: ConversationSummary, right: ConversationSummary) {
  return left.id === right.id
    && left.chatId === right.chatId
    && left.franchiseId === right.franchiseId
    && left.franchiseName === right.franchiseName
    && left.agentName === right.agentName
    && left.customerName === right.customerName
    && left.customerPhone === right.customerPhone
    && left.customerPicture === right.customerPicture
    && left.firstPrompt === right.firstPrompt
    && left.lastResponse === right.lastResponse
    && left.channelType === right.channelType
    && left.operationalStatus === right.operationalStatus
    && left.responsibleUserName === right.responsibleUserName
    && left.syncStatus === right.syncStatus
    && left.closedReason === right.closedReason
    && left.saleOutcome === right.saleOutcome
    && left.handoffStatus === right.handoffStatus
    && left.humanTakeoverActive === right.humanTakeoverActive
    && left.lastMessageAt === right.lastMessageAt
    && left.createdAt === right.createdAt
    && left.updatedAt === right.updatedAt
    && left.read === right.read
    && left.unReadCount === right.unReadCount;
}

function conversationKey(conversation: ConversationSummary) {
  if (conversation.chatId) {
    return `chat:${conversation.franchiseId}:${conversation.chatId}`;
  }
  if (conversation.id) {
    return `session:${conversation.id}`;
  }
  return `remote:${conversation.franchiseId}:${conversation.customerPhone || conversation.customerName || "unknown"}`;
}

function mergeConversations(current: ConversationSummary[], incoming: ConversationSummary[]) {
  const unique = new Map<string, ConversationSummary>();
  current.forEach((conversation) => unique.set(conversationKey(conversation), conversation));
  incoming.forEach((conversation) => {
    const key = conversationKey(conversation);
    const existing = unique.get(key);
    if (!existing || !sameConversationSummary(existing, conversation)) {
      unique.set(key, conversation);
    }
  });
  const sorted = sortConversationsByRecent(Array.from(unique.values()));
  if (sorted.length === current.length && sorted.every((item, index) => item === current[index])) {
    return current;
  }
  return sorted;
}

function conversationDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localDayStart(value: Date) {
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
}

function conversationGroupKey(value?: string | null) {
  const date = conversationDate(value);
  if (!date) {
    return "sem-data";
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function conversationGroupLabel(value?: string | null) {
  const date = conversationDate(value);
  if (!date) {
    return "Sem data";
  }

  const today = localDayStart(new Date());
  const conversationDay = localDayStart(date);
  const dayDifference = Math.floor((today - conversationDay) / (24 * 60 * 60 * 1000));

  if (dayDifference === 0) {
    return "Hoje";
  }
  if (dayDifference === 1) {
    return "Ontem";
  }
  if (dayDifference >= 2 && dayDifference < 7) {
    return titleizeDayLabel(new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date));
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
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

function sameMessage(left: ConversationMessage, right: ConversationMessage) {
  return left.id === right.id
    && left.role === right.role
    && left.type === right.type
    && left.text === right.text
    && left.userName === right.userName
    && left.userPicture === right.userPicture
    && left.imageUrl === right.imageUrl
    && left.audioUrl === right.audioUrl
    && left.documentUrl === right.documentUrl
    && left.fileName === right.fileName
    && left.mediaContent === right.mediaContent
    && left.time === right.time
    && left.width === right.width
    && left.height === right.height;
}

function mergeMessages(current: ConversationMessage[], incoming: ConversationMessage[]) {
  const unique = new Map<string, ConversationMessage>();
  current.forEach((message) => unique.set(messageIdentity(message), message));
  incoming.forEach((message) => unique.set(messageIdentity(message), message));
  return Array.from(unique.values()).sort((left, right) => {
    const leftTime = normalizeTimestamp(left.time) ?? 0;
    const rightTime = normalizeTimestamp(right.time) ?? 0;
    return leftTime - rightTime;
  });
}

function countNewMessages(current: ConversationMessage[], incoming: ConversationMessage[]) {
  const known = new Set(current.map(messageIdentity));
  return incoming.reduce((count, message) => count + (known.has(messageIdentity(message)) ? 0 : 1), 0);
}

function prependAndSortMessages(current: ConversationMessage[], older: ConversationMessage[]) {
  return mergeMessages(current, older);
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
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);
  const [isMaterializingConversation, setIsMaterializingConversation] = useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentMessagePage, setCurrentMessagePage] = useState(1);
  const [pendingNewMessages, setPendingNewMessages] = useState(0);
  const conversationsContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const conversationsRef = useRef<ConversationSummary[]>([]);
  const selectedConversationIdRef = useRef("");
  const messagesRef = useRef<ConversationMessage[]>([]);
  const currentConversationPageRef = useRef(0);
  const hasMoreConversationsRef = useRef(true);
  const conversationRequestInFlightRef = useRef(false);
  const conversationPollingInFlightRef = useRef(false);
  const pendingConversationReloadRef = useRef(false);
  const loadConversationsRef = useRef<() => Promise<void>>(async () => undefined);
  const pollingEffectActiveRef = useRef(false);
  const conversationMaterializationInFlightRef = useRef(false);
  const conversationLoadGenerationRef = useRef(0);
  const loadedMessagePagesRef = useRef(new Set<number>());
  const currentMessagePageRef = useRef(1);
  const hasMoreMessagesRef = useRef(false);
  const messageRequestInFlightRef = useRef(false);
  const messageLoadGenerationRef = useRef(0);
  const initializedConversationRef = useRef<string | null>(null);
  const pendingOpenConversationRefreshRef = useRef<ConversationSummary | null>(null);
  const pendingScrollAdjustmentRef = useRef<
    { height: number; top: number }
    | { preserveTop: number }
    | "bottom"
    | null
  >(null);

  conversationsRef.current = conversations;
  selectedConversationIdRef.current = selectedConversationId;
  messagesRef.current = messages;

  function selectConversation(conversation: ConversationSummary) {
    setError(null);
    setSelectedConversationId(conversationKey(conversation));
  }

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
    if (conversationPollingInFlightRef.current) {
      pendingConversationReloadRef.current = true;
      return;
    }
    const generation = ++conversationLoadGenerationRef.current;
    currentConversationPageRef.current = 0;
    hasMoreConversationsRef.current = true;
    conversationRequestInFlightRef.current = true;
    setIsLoading(true);
    setIsLoadingMoreConversations(false);
    setHasMoreConversations(true);
    setError(null);
    try {
      const response = await getConversationPage({
        franchiseId: isSuperAdmin ? selectedFranchiseId || undefined : undefined,
        status: selectedStatus || undefined
      }, 1, CONVERSATION_PAGE_SIZE);
      if (generation !== conversationLoadGenerationRef.current) return;
      const items = sortConversationsByRecent(response.items);
      const existingSelected = conversations.find((item) => conversationKey(item) === selectedConversationId);
      const canPreserveSelected = existingSelected
        && (!isSuperAdmin || !selectedFranchiseId || existingSelected.franchiseId === selectedFranchiseId)
        && (!selectedStatus || existingSelected.operationalStatus === selectedStatus);
      const nextItems = canPreserveSelected && !items.some((item) => conversationKey(item) === conversationKey(existingSelected))
        ? mergeConversations(items, [existingSelected])
        : items;
      currentConversationPageRef.current = response.page;
      hasMoreConversationsRef.current = response.hasMore;
      setHasMoreConversations(response.hasMore);
      conversationsRef.current = nextItems;
      setConversations(nextItems);
      const selectedStillPresent = Boolean(selectedConversationId)
        && nextItems.some((item) => conversationKey(item) === selectedConversationId);
      setSelectedConversationId(selectedStillPresent ? selectedConversationId : "");
      if (!selectedStillPresent && nextItems[0]) {
        setSelectedConversationId(conversationKey(nextItems[0]));
      }
    } catch (requestError) {
      if (generation !== conversationLoadGenerationRef.current) return;
      currentConversationPageRef.current = 0;
      hasMoreConversationsRef.current = false;
      setHasMoreConversations(false);
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar conversas.");
    } finally {
      if (generation === conversationLoadGenerationRef.current) {
        conversationRequestInFlightRef.current = false;
        setIsLoading(false);
      }
    }
  }

  loadConversationsRef.current = loadConversations;

  async function loadMoreConversations() {
    if (!user || conversationRequestInFlightRef.current || conversationPollingInFlightRef.current || !hasMoreConversationsRef.current) {
      return;
    }
    const page = currentConversationPageRef.current + 1;
    const generation = conversationLoadGenerationRef.current;
    conversationRequestInFlightRef.current = true;
    setIsLoadingMoreConversations(true);
    try {
      const response = await getConversationPage({
        franchiseId: isSuperAdmin ? selectedFranchiseId || undefined : undefined,
        status: selectedStatus || undefined
      }, page, CONVERSATION_PAGE_SIZE);
      if (generation !== conversationLoadGenerationRef.current) return;
      currentConversationPageRef.current = response.page;
      hasMoreConversationsRef.current = response.hasMore;
      setHasMoreConversations(response.hasMore);
      setConversations((current) => {
        const merged = mergeConversations(current, response.items);
        conversationsRef.current = merged;
        return merged;
      });
    } catch (requestError) {
      if (generation !== conversationLoadGenerationRef.current) return;
      if (conversations.length === 0) {
        hasMoreConversationsRef.current = false;
        setHasMoreConversations(false);
      }
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar mais conversas.");
    } finally {
      if (generation === conversationLoadGenerationRef.current) {
        conversationRequestInFlightRef.current = false;
        setIsLoadingMoreConversations(false);
      }
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    void loadConversations();
  }, [selectedFranchiseId, selectedStatus, user]);

  useEffect(() => {
    if (isLoading || isLoadingMoreConversations || conversations.length > 0 || !hasMoreConversations) {
      return;
    }
    void loadMoreConversations();
  }, [conversations.length, hasMoreConversations, isLoading, isLoadingMoreConversations]);

  function getConversationMessagesPage(conversation: ConversationSummary, page: number) {
    const target = resolveConversationMessageTarget(conversation);
    if (!target) {
      return Promise.reject(new Error("Conversa sem identificador GPTMaker."));
    }

    if (target.type === "remote") {
      return getRemoteConversationMessages(
        target.chatId,
        isSuperAdmin ? selectedFranchiseId || undefined : undefined,
        page,
        MESSAGE_PAGE_SIZE
      );
    }
    return getConversationMessages(target.id, page, MESSAGE_PAGE_SIZE);
  }

  async function loadInitialMessages(conversation: ConversationSummary) {
    const conversationId = conversationKey(conversation);
    const generation = ++messageLoadGenerationRef.current;
    initializedConversationRef.current = conversationId;
    pendingOpenConversationRefreshRef.current = null;
    loadedMessagePagesRef.current = new Set();
    currentMessagePageRef.current = 1;
    hasMoreMessagesRef.current = false;
    messageRequestInFlightRef.current = true;
    pendingScrollAdjustmentRef.current = null;
    setPendingNewMessages(0);
    messagesRef.current = [];
    setMessages([]);
    setCurrentMessagePage(1);
    setHasMoreMessages(false);
    setIsLoadingMessages(true);
    setIsLoadingOlderMessages(false);
    try {
      const response = await getConversationMessagesPage(conversation, 1);
      if (generation !== messageLoadGenerationRef.current) return;
      loadedMessagePagesRef.current.add(1);
      pendingScrollAdjustmentRef.current = "bottom";
      messagesRef.current = response.items;
      setMessages(response.items);
      currentMessagePageRef.current = 1;
      hasMoreMessagesRef.current = response.hasMore;
      setCurrentMessagePage(1);
      setHasMoreMessages(response.hasMore);
    } catch {
      if (generation !== messageLoadGenerationRef.current) return;
      messagesRef.current = [];
      setMessages([]);
      hasMoreMessagesRef.current = false;
      setHasMoreMessages(false);
      setError("Nao foi possivel carregar as mensagens desta conversa.");
    } finally {
      if (generation === messageLoadGenerationRef.current) {
        messageRequestInFlightRef.current = false;
        setIsLoadingMessages(false);
        const pendingConversation = pendingOpenConversationRefreshRef.current;
        pendingOpenConversationRefreshRef.current = null;
        if (pendingConversation && selectedConversationIdRef.current === conversationKey(pendingConversation)) {
          void refreshOpenConversationMessages(pendingConversation);
        }
      }
    }
  }

  async function loadOlderMessages() {
    const conversation = conversations.find((item) => conversationKey(item) === selectedConversationId);
    if (!conversation || messageRequestInFlightRef.current || !hasMoreMessagesRef.current) return;
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
      const response = await getConversationMessagesPage(conversation, page);
      if (generation !== messageLoadGenerationRef.current) return;
      loadedMessagePagesRef.current.add(page);
      currentMessagePageRef.current = page;
      hasMoreMessagesRef.current = response.hasMore;
      setMessages((current) => {
        const merged = prependAndSortMessages(current, response.items);
        messagesRef.current = merged;
        return merged;
      });
      setCurrentMessagePage(page);
      setHasMoreMessages(response.hasMore);
    } catch {
      pendingScrollAdjustmentRef.current = null;
    } finally {
      if (generation === messageLoadGenerationRef.current) {
        messageRequestInFlightRef.current = false;
        setIsLoadingOlderMessages(false);
        const pendingConversation = pendingOpenConversationRefreshRef.current;
        pendingOpenConversationRefreshRef.current = null;
        if (pendingConversation && selectedConversationIdRef.current === conversationKey(pendingConversation)) {
          void refreshOpenConversationMessages(pendingConversation);
        }
      }
    }
  }

  useEffect(() => {
    const conversation = conversations.find((item) => conversationKey(item) === selectedConversationId);
    if (!conversation) {
      messageLoadGenerationRef.current += 1;
      initializedConversationRef.current = null;
      currentMessagePageRef.current = 1;
      hasMoreMessagesRef.current = false;
      messagesRef.current = [];
      pendingOpenConversationRefreshRef.current = null;
      setMessages([]);
      setCurrentMessagePage(1);
      setHasMoreMessages(false);
      setPendingNewMessages(0);
      return;
    }
    if (initializedConversationRef.current === selectedConversationId) return;
    void loadInitialMessages(conversation);
  }, [conversations, selectedConversationId]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const pending = pendingScrollAdjustmentRef.current;
    if (!container || !pending) return;
    if (pending === "bottom") {
      container.scrollTop = container.scrollHeight;
    } else if ("preserveTop" in pending) {
      container.scrollTop = pending.preserveTop;
    } else {
      container.scrollTop = pending.top + (container.scrollHeight - pending.height);
    }
    pendingScrollAdjustmentRef.current = null;
  }, [messages]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => conversationKey(item) === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  async function refreshOpenConversationMessages(conversation: ConversationSummary) {
    const conversationId = conversationKey(conversation);
    if (conversationId !== selectedConversationIdRef.current
      || initializedConversationRef.current !== conversationId
    ) {
      return;
    }
    if (messageRequestInFlightRef.current) {
      pendingOpenConversationRefreshRef.current = conversation;
      return;
    }

    const generation = messageLoadGenerationRef.current;
    const container = messagesContainerRef.current;
    const previousHeight = container?.scrollHeight ?? 0;
    const previousTop = container?.scrollTop ?? 0;
    const distanceToBottom = container
      ? container.scrollHeight - container.scrollTop - container.clientHeight
      : 0;
    const wasNearBottom = !container || distanceToBottom <= LOAD_NEWER_MESSAGES_THRESHOLD_PX;
    const currentMessages = messagesRef.current;
    messageRequestInFlightRef.current = true;

    try {
      const response = await getConversationMessagesPage(conversation, 1);
      if (generation !== messageLoadGenerationRef.current || selectedConversationIdRef.current !== conversationId) {
        return;
      }

      const merged = mergeMessages(currentMessages, response.items);
      const changed = merged.length !== currentMessages.length
        || merged.some((message, index) => !currentMessages[index] || !sameMessage(message, currentMessages[index]));
      if (!changed) {
        return;
      }

      loadedMessagePagesRef.current.add(1);
      pendingScrollAdjustmentRef.current = wasNearBottom
        ? "bottom"
        : { preserveTop: previousTop };
      messagesRef.current = merged;
      setMessages(merged);

      const newMessages = countNewMessages(currentMessages, response.items);
      if (wasNearBottom) {
        setPendingNewMessages(0);
      } else if (newMessages > 0) {
        setPendingNewMessages((current) => Math.min(current + newMessages, 99));
      }
    } catch {
      // Polling failure must preserve the current messages and scroll state.
    } finally {
      if (generation === messageLoadGenerationRef.current) {
        messageRequestInFlightRef.current = false;
      }
    }
  }

  useEffect(() => {
    if (!user || (isSuperAdmin && !selectedFranchiseId)) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let backoffMs = POLLING_INTERVAL_MS;
    pollingEffectActiveRef.current = true;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const scheduleNext = (delayMs: number) => {
      clearTimer();
      if (!cancelled && document.visibilityState === "visible") {
        timer = setTimeout(() => {
          void pollOnce();
        }, delayMs);
      }
    };

    const pollOnce = async () => {
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }
      if (conversationPollingInFlightRef.current || conversationRequestInFlightRef.current) {
        scheduleNext(POLLING_INTERVAL_MS);
        return;
      }

      conversationPollingInFlightRef.current = true;
      let nextDelayMs = POLLING_INTERVAL_MS;
      try {
        const response = await getConversationPage({
          franchiseId: isSuperAdmin ? selectedFranchiseId || undefined : undefined,
          status: selectedStatus || undefined
        }, 1, CONVERSATION_PAGE_SIZE);
        if (cancelled) {
          return;
        }

        const current = conversationsRef.current;
        const previousSelected = current.find((item) => conversationKey(item) === selectedConversationIdRef.current);
        const merged = mergeConversations(current, response.items);
        if (merged !== current) {
          conversationsRef.current = merged;
          setConversations(merged);
        }

        const refreshedSelected = merged.find((item) => conversationKey(item) === selectedConversationIdRef.current);
        if (previousSelected && refreshedSelected && !sameConversationSummary(previousSelected, refreshedSelected)) {
          await refreshOpenConversationMessages(refreshedSelected);
        }
        backoffMs = POLLING_INTERVAL_MS;
      } catch {
        nextDelayMs = Math.min(backoffMs * 2, POLLING_MAX_BACKOFF_MS);
        backoffMs = nextDelayMs;
      } finally {
        conversationPollingInFlightRef.current = false;
        if (pendingConversationReloadRef.current && pollingEffectActiveRef.current) {
          pendingConversationReloadRef.current = false;
          void loadConversationsRef.current();
          return;
        }
        if (cancelled) {
          return;
        }
        scheduleNext(nextDelayMs);
      }
    };

    const handleVisibilityChange = () => {
      clearTimer();
      if (document.visibilityState === "visible") {
        void pollOnce();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (pendingConversationReloadRef.current && !conversationPollingInFlightRef.current) {
      pendingConversationReloadRef.current = false;
      void loadConversationsRef.current();
    }
    if (document.visibilityState === "visible") {
      scheduleNext(POLLING_INTERVAL_MS);
    }

    return () => {
      cancelled = true;
      pollingEffectActiveRef.current = false;
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  // The polling effect deliberately closes over the current filter and message loader.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, selectedFranchiseId, selectedStatus, user]);

  const groupedConversations = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; items: ConversationSummary[] }>();
    conversations.forEach((conversation) => {
      const timestamp = conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt;
      const key = conversationGroupKey(timestamp);
      const current = groups.get(key);
      if (current) {
        current.items.push(conversation);
        return;
      }
      groups.set(key, {
        key,
        label: conversationGroupLabel(timestamp),
        items: [conversation]
      });
    });
    return Array.from(groups.values());
  }, [conversations]);
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
  const canOperateConversation = Boolean(selectedConversation?.id || selectedConversation?.chatId);

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

  async function ensureOperationalConversationId() {
    if (!selectedConversation) {
      throw new Error("Selecione uma conversa.");
    }
    if (selectedConversation.id) {
      return selectedConversation.id;
    }
    if (!selectedConversation.chatId) {
      throw new Error("Conversa sem chat GPTMaker para executar esta acao.");
    }
    if (conversationMaterializationInFlightRef.current) {
      throw new Error("Aguarde a materializacao da conversa.");
    }

    conversationMaterializationInFlightRef.current = true;
    setIsMaterializingConversation(true);
    try {
      const materialized = await materializeConversation({
        franchiseId: isSuperAdmin ? selectedFranchiseId || undefined : undefined,
        chatId: selectedConversation.chatId
      });
      if (!materialized.id) {
        throw new Error("O backend nao retornou identificador da conversa.");
      }
      setConversations((current) => current.map((item) => (
        conversationKey(item) === conversationKey(selectedConversation)
          ? {
              ...item,
              ...materialized,
              customerPicture: materialized.customerPicture || item.customerPicture
            }
          : item
      )));
      setSelectedConversationId(conversationKey(materialized));
      return materialized.id;
    } finally {
      conversationMaterializationInFlightRef.current = false;
      setIsMaterializingConversation(false);
    }
  }

  async function runAction(action: (conversationId: string) => Promise<{ message: string }>) {
    setIsActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const conversationForMessages = selectedConversation;
      const conversationId = await ensureOperationalConversationId();
      const operationalConversation = conversationForMessages && !conversationForMessages.id
        ? { ...conversationForMessages, id: conversationId }
        : conversationForMessages;
      const result = await action(conversationId);
      setSuccess(result.message);
      setManualMessage("");
      setSaleSummary("");
      await loadConversations();
      if (operationalConversation) {
        await loadInitialMessages(operationalConversation);
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
    if (!canOperateConversation || !saleSummary.trim()) return;
    const completed = await runAction((conversationId) => completeConversation(conversationId, {
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
              <div
                ref={conversationsContainerRef}
                onScroll={(event) => {
                  const container = event.currentTarget;
                  const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                  if (distanceToBottom <= LOAD_NEWER_CONVERSATIONS_THRESHOLD_PX) {
                    void loadMoreConversations();
                  }
                }}
                className="mt-3 max-h-[calc(100dvh-24rem)] min-h-[18rem] overflow-x-hidden overflow-y-auto scrollbar-thin"
              >
                {groupedConversations.map((group) => (
                  <section key={group.key} aria-label={group.label}>
                    <div className="sticky top-0 z-10 flex items-center gap-2 bg-bg-primary/95 px-3 py-2 backdrop-blur-sm">
                      <span className="text-xs font-semibold text-text-secondary">{group.label}</span>
                      <span className="h-px flex-1 bg-line/70" />
                    </div>
                    {group.items.map((conversation) => {
                      const unreadCount = conversation.unReadCount ?? (conversation.read === false ? 1 : 0);
                      return (
                        <button
                          key={conversationKey(conversation)}
                          type="button"
                          onClick={() => void selectConversation(conversation)}
                          disabled={isMaterializingConversation}
                          className={`flex min-w-0 w-full gap-3 border-b px-3 py-3.5 text-left transition-colors ${selectedConversationId === conversationKey(conversation) ? "bg-brand-50 dark:bg-brand-900/20" : "hover:bg-bg-secondary"} disabled:cursor-wait disabled:opacity-70`}
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
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-2xs text-text-tertiary">{formatDate(conversation.lastMessageAt || conversation.updatedAt)}</span>
                                {unreadCount > 0 ? (
                                  <span className="flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-2xs font-semibold text-white" aria-label={`${unreadCount} mensagens não lidas`}>
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                  </span>
                                ) : null}
                              </div>
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
                      );
                    })}
                  </section>
                ))}
                {isLoadingMoreConversations ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-3 text-xs text-text-tertiary">
                    <Loader2 size={14} className="animate-spin" />
                    Carregando conversas antigas...
                  </div>
                ) : null}
              </div>
            ) : isLoadingMoreConversations ? (
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-text-tertiary">
                <Loader2 size={15} className="animate-spin" />
                Carregando conversas...
              </p>
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
                  <button type="button" onClick={() => void runAction((conversationId) => startHumanTakeover(conversationId))} disabled={isActionLoading || isMaterializingConversation || !canOperateConversation || selectedConversation.humanTakeoverActive || isConversationClosed} className="btn-secondary px-3 py-2 text-xs disabled:opacity-50">
                    Assumir
                  </button>
                  <button type="button" onClick={() => void runAction((conversationId) => stopHumanTakeover(conversationId))} disabled={isActionLoading || isMaterializingConversation || !canOperateConversation || !selectedConversation.humanTakeoverActive || isConversationClosed} className="btn-secondary px-3 py-2 text-xs disabled:opacity-50">
                    Devolver para IA
                  </button>
                  <button type="button" onClick={() => void runAction((conversationId) => completeConversation(conversationId, { outcome: "CONCLUIDA", closedReason: "Atendimento encerrado" }))} disabled={isActionLoading || isMaterializingConversation || !canOperateConversation || isConversationClosed} className="btn-ghost px-3 py-2 text-xs disabled:opacity-50">
                    Encerrar
                  </button>
                  <button type="button" onClick={() => setIsSaleDialogOpen(true)} disabled={isActionLoading || isMaterializingConversation || !canOperateConversation || isConversationClosed} className="btn-primary px-3 py-2 text-xs disabled:opacity-50">
                    Concluir venda
                  </button>
                </div>
              </div>

              <div className="h-full min-h-0 min-w-0">
                <div className="grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto]">
                  <div className="relative min-h-0 overflow-hidden">
                    <div
                      ref={messagesContainerRef}
                      onScroll={(event) => {
                        if (event.currentTarget.scrollTop <= LOAD_OLDER_THRESHOLD_PX) {
                          void loadOlderMessages();
                        }
                      }}
                      data-current-page={currentMessagePage}
                      data-has-more={hasMoreMessages}
                      className="grid h-[65dvh] min-h-0 content-start gap-5 overflow-x-hidden overflow-y-auto overscroll-contain bg-bg-secondary px-4 py-5 scrollbar-thin sm:h-full lg:h-auto"
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
                    {pendingNewMessages > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          const container = messagesContainerRef.current;
                          if (container) {
                            container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
                          }
                          setPendingNewMessages(0);
                        }}
                        className="absolute bottom-4 right-5 rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-soft-lg hover:bg-brand-700"
                      >
                        {pendingNewMessages === 1 ? "1 nova mensagem" : `${pendingNewMessages} novas mensagens`}
                      </button>
                    ) : null}
                  </div>

                  <div className="border-t bg-bg-primary p-3 sm:p-4" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-end gap-2 rounded-2xl border bg-bg-secondary p-2" style={{ borderColor: "var(--color-border)" }}>
                      <textarea className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text-primary outline-none" placeholder={selectedConversation.humanTakeoverActive ? "Digite uma mensagem..." : "Assuma o atendimento para responder"} value={manualMessage} disabled={!selectedConversation.humanTakeoverActive || isConversationClosed} onChange={(event) => setManualMessage(event.target.value)} />
                      <button type="button" aria-label="Enviar mensagem" onClick={() => void runAction((conversationId) => sendConversationManualMessage(conversationId, { message: manualMessage }))} disabled={isActionLoading || isMaterializingConversation || !canOperateConversation || !manualMessage.trim() || !selectedConversation.humanTakeoverActive || isConversationClosed} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">
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
