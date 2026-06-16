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
  const [contextId, setContextId] = useState("");
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
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as conversas.");
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
        setMessageError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as mensagens.");
      })
      .finally(() => setIsLoadingMessages(false));
  }, [selectedConversationId]);

  async function handleTestAgent() {
    const franchiseId = isSuperAdmin ? selectedFranchiseId : user?.franchise?.id;
    if (!franchiseId) {
      setError("Selecione a franquia antes de testar o agente.");
      setSuccess(null);
      return;
    }
    if (!prompt.trim() || !contextId.trim()) {
      setError("Informe mensagem e contextId para testar o agente.");
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
        contextId,
        customerName: customerName || undefined,
        phone: phone || undefined
      });
      const refreshed = await getConversations(isSuperAdmin ? franchiseId : undefined);
      setConversations(refreshed);
      setSelectedConversationId(result.conversationId);
      setSuccess(result.message || "Agente testado com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel testar o agente.");
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
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel assumir o atendimento.");
    } finally {
      setIsStartingHuman(false);
    }
  }

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? null;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Atendimento"
        title="Conversas"
        description={isSuperAdmin ? "Acompanhe conversas reais e teste agentes por franquia." : "Veja os atendimentos vinculados ao agente da sua franquia."}
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
                <p className="mt-1 text-sm text-slate-500">Envie uma mensagem real ao GPTMaker sem depender de canal externo.</p>
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
                <span className="text-sm font-medium text-slate-700">Mensagem</span>
                <textarea className="min-h-[110px] rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">contextId</span>
                <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={contextId} onChange={(event) => setContextId(event.target.value)} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Nome do cliente</span>
                <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Telefone</span>
                <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <button type="button" onClick={() => void handleTestAgent()} disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Testar agente
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="font-semibold text-ink">Conversas</h2>
            {isLoading ? (
              <p className="mt-4 text-sm text-slate-500">Carregando conversas...</p>
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
                        <p className="font-semibold text-ink">{conversation.customerName || "Cliente nao identificado"}</p>
                        <p className="mt-1 text-sm text-slate-500">{conversation.agentName || "Agente da franquia"}</p>
                      </div>
                      <StatusBadge status={conversation.humanTakeoverActive ? "ATIVO" : "PENDENTE"} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{conversation.lastResponse || conversation.firstPrompt || "Sem mensagens salvas."}</p>
                    <p className="mt-3 text-xs text-slate-400">{formatDate(conversation.updatedAt)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={MessageSquareText} title="Ainda nao ha conversas sincronizadas" description="Quando os atendimentos chegarem pelo GPTMaker, eles aparecerao aqui." />
            )}
          </section>
        </aside>

        <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          {selectedConversation ? (
            <>
              <div className="flex flex-col gap-4 border-b border-line/80 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{selectedConversation.customerName || "Conversa selecionada"}</h2>
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
                      <p>{message.text || "Mensagem sem texto"}</p>
                    </article>
                  ))
                ) : (
                  <EmptyState icon={MessageSquareText} title="Nenhuma mensagem sincronizada" description="Quando o GPTMaker retornar mensagens deste atendimento, elas aparecerao aqui." />
                )}
              </div>
            </>
          ) : (
            <EmptyState icon={MessageSquareText} title="Selecione uma conversa" description="Escolha um atendimento na coluna lateral para ver mensagens e assumir o atendimento quando necessario." />
          )}
        </section>
      </section>
    </AppShell>
  );
}
