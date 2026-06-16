"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import {
  getConversationMessages,
  getConversations,
  getFranchises,
  startHumanTakeover,
  testAgentConversation,
  type ConversationMessage,
  type ConversationSummary,
  type FranchiseSummary
} from "@/lib/api";
import { Bot, Building2, Loader2, MessageSquareText, Send, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

function formatDate(value?: string | null) {
  if (!value) {
    return "Agora";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function ConversationsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingHuman, setIsStartingHuman] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (isSuperAdmin) {
      getFranchises().then((items) => {
        setFranchises(items);
        if (!selectedFranchiseId && items[0]?.id) {
          setSelectedFranchiseId(items[0].id);
        }
      }).catch(() => setFranchises([]));
      return;
    }

    if (user.franchise?.id) {
      setSelectedFranchiseId(user.franchise.id);
    }
  }, [isSuperAdmin, selectedFranchiseId, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setError(null);
    getConversations(isSuperAdmin ? (selectedFranchiseId || undefined) : undefined)
      .then((items) => {
        setConversations(items);
        setSelectedConversationId((current) => current || items[0]?.id || "");
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as conversas.");
      })
      .finally(() => setIsLoading(false));
  }, [isSuperAdmin, selectedFranchiseId, user]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    setMessageError(null);
    getConversationMessages(selectedConversationId)
      .then(setMessages)
      .catch((requestError) => {
        setMessageError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as mensagens.");
      })
      .finally(() => setIsLoadingMessages(false));
  }, [selectedConversationId]);

  async function handleTestAgent() {
    const franchiseId = isSuperAdmin ? selectedFranchiseId : user?.franchise?.id;
    if (!franchiseId) {
      setError("Selecione a franquia.");
      setSuccess(null);
      return;
    }
    if (!prompt.trim()) {
      setError("Digite uma mensagem.");
      setSuccess(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await testAgentConversation({
        franchiseId,
        prompt,
        customerName: customerName || undefined,
        phone: phone || undefined
      });
      const refreshed = await getConversations(isSuperAdmin ? franchiseId : undefined);
      setConversations(refreshed);
      if (result.conversationId) {
        setSelectedConversationId(result.conversationId);
      }
      setSuccess("Mensagem enviada.");
      setPrompt("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível enviar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStartHuman() {
    if (!selectedConversationId) {
      return;
    }
    setIsStartingHuman(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await startHumanTakeover(selectedConversationId);
      setSuccess(result.message);
      const refreshed = await getConversations(isSuperAdmin ? (selectedFranchiseId || undefined) : undefined);
      setConversations(refreshed);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível assumir.");
    } finally {
      setIsStartingHuman(false);
    }
  }

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? null;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Atendimento"
        title="Central de Atendimento"
        description={isSuperAdmin ? "Acompanhe as conversas por franquia." : "Veja os atendimentos da sua franquia."}
      />

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="grid gap-5">
          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-ink">Testar agente</h2>
                <p className="mt-1 text-sm text-slate-500">Simule um atendimento.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {isSuperAdmin ? (
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">Franquia</span>
                  <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={selectedFranchiseId} onChange={(event) => setSelectedFranchiseId(event.target.value)}>
                    <option value="">Selecione</option>
                    {franchises.map((franchise) => (
                      <option key={franchise.id} value={franchise.id}>{franchise.name}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Cliente</span>
                <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" placeholder="Nome do cliente" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Telefone</span>
                <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" placeholder="(11) 99999-9999" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Mensagem</span>
                <textarea className="min-h-[110px] rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" placeholder="Digite a mensagem do cliente..." value={prompt} onChange={(event) => setPrompt(event.target.value)} />
              </label>
              <button type="button" onClick={() => void handleTestAgent()} disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Enviar
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="font-semibold text-ink">Conversas</h2>
            {isLoading ? (
              <p className="mt-4 text-sm text-slate-500">Carregando...</p>
            ) : conversations.length ? (
              <div className="mt-4 grid gap-3">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`rounded-2xl border p-4 text-left transition ${selectedConversationId === conversation.id ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{conversation.customerName || "Cliente"}</p>
                        <p className="mt-1 text-sm text-slate-500">{conversation.franchiseName}</p>
                      </div>
                      <StatusBadge status={conversation.humanTakeoverActive ? "ATIVO" : "PENDENTE"} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{conversation.lastResponse || conversation.firstPrompt || "Sem mensagens."}</p>
                    <p className="mt-3 text-xs text-slate-400">{formatDate(conversation.updatedAt)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={MessageSquareText} title="Nenhuma conversa" description="Quando houver atendimentos, eles aparecerão aqui." />
            )}
          </section>
        </aside>

        <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          {selectedConversation ? (
            <>
              <div className="flex flex-col gap-4 border-b border-line/80 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{selectedConversation.customerName || "Conversa"}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedConversation.franchiseName}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Building2 size={14} /> {selectedConversation.franchiseName}</span>
                    {selectedConversation.customerPhone ? <span className="inline-flex items-center gap-1"><UserRound size={14} /> {selectedConversation.customerPhone}</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void handleStartHuman()} disabled={isStartingHuman} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-line disabled:opacity-60">
                    {isStartingHuman ? "Assumindo..." : "Assumir atendimento"}
                  </button>
                </div>
              </div>

              {messageError ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{messageError}</p> : null}
              <div className="mt-5 grid gap-3">
                {isLoadingMessages ? (
                  <p className="text-sm text-slate-500">Carregando mensagens...</p>
                ) : messages.length ? (
                  messages.map((message) => (
                    <article key={message.id} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role?.toUpperCase() === "USER" ? "bg-slate-100 text-slate-700" : "ml-auto bg-ink text-white"}`}>
                      <p className="mb-1 text-xs opacity-60">
                        {message.role?.toUpperCase() === "USER" ? "Cliente" : "Agente"}
                      </p>
                      <p>{message.text || ""}</p>
                    </article>
                  ))
                ) : (
                  <EmptyState icon={MessageSquareText} title="Nenhuma mensagem" description="As mensagens aparecerão aqui quando houver atendimento." />
                )}
              </div>
            </>
          ) : (
            <EmptyState icon={MessageSquareText} title="Selecione uma conversa" description="Escolha um atendimento na lista ao lado." />
          )}
        </section>
      </section>
    </AppShell>
  );
}
