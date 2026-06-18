"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import {
  completeConversation,
  getConversationHandoffs,
  getConversationMessages,
  getConversations,
  getFranchises,
  sendConversationManualMessage,
  startHumanTakeover,
  stopHumanTakeover,
  testAgentConversation,
  type ConversationHandoffEvent,
  type ConversationMessage,
  type ConversationSummary,
  type FranchiseSummary
} from "@/lib/api";
import { Bot, Loader2, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatDate(value?: string | null) {
  if (!value) {
    return "Agora";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
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
  const [handoffs, setHandoffs] = useState<ConversationHandoffEvent[]>([]);
  const [testPrompt, setTestPrompt] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [saleSummary, setSaleSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

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
      const items = await getConversations({
        franchiseId: isSuperAdmin ? selectedFranchiseId || undefined : undefined,
        status: selectedStatus || undefined
      });
      setConversations(items);
      setSelectedConversationId((current) => current || items[0]?.id || "");
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

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setHandoffs([]);
      return;
    }
    getConversationMessages(selectedConversationId).then(setMessages).catch(() => setMessages([]));
    getConversationHandoffs(selectedConversationId).then(setHandoffs).catch(() => setHandoffs([]));
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );
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
        setMessages(await getConversationMessages(selectedConversationId));
        setHandoffs(await getConversationHandoffs(selectedConversationId));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel concluir a acao.");
    } finally {
      setIsActionLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Atendimento"
        title="Inbox operacional"
        description={isSuperAdmin ? "Conversas reais, fila humana e handoff comercial por franquia." : "Fila de atendimento da sua franquia."}
      />

      {error ? <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{success}</p> : null}

      <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="grid gap-5">
          <section className="card p-5">
            <h2 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Nova conversa de teste</h2>
            <div className="mt-4 grid gap-3">
              {isSuperAdmin ? (
                <select className="input-field" value={selectedFranchiseId} onChange={(event) => setSelectedFranchiseId(event.target.value)}>
                  {franchises.map((franchise) => (
                    <option key={franchise.id} value={franchise.id}>{franchise.name}</option>
                  ))}
                </select>
              ) : null}
              <textarea className="input-field min-h-[110px]" placeholder="Mensagem inicial do cliente" value={testPrompt} onChange={(event) => setTestPrompt(event.target.value)} />
              <button type="button" onClick={() => void handleTestAgent()} disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Criar conversa
              </button>
            </div>
          </section>

          <section className="card p-5">
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
              <div className="mt-4 grid gap-3">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`rounded-2xl border p-4 text-left transition ${selectedConversationId === conversation.id ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-line bg-white dark:bg-surface hover:bg-slate-50 dark:hover:bg-surface-hover"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{conversation.customerName || "Cliente"}</p>
                        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{conversation.franchiseName}</p>
                      </div>
                      <StatusBadge status={conversation.operationalStatus} />
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>{conversation.channelType || "WEBCHAT"}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>{conversation.lastResponse || conversation.firstPrompt || "Sem mensagens."}</p>
                    <p className="mt-3 text-xs" style={{ color: "var(--color-text-tertiary)" }}>{formatDate(conversation.lastMessageAt || conversation.updatedAt)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={MessageSquareText} title="Nenhuma conversa" description="Quando houver conversas sincronizadas, elas aparecerao aqui." />
            )}
          </section>
        </aside>

        <section className="card p-5">
          {selectedConversation ? (
            <div className="grid gap-5">
              <div className="flex flex-col gap-4 border-b border-line/80 pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{selectedConversation.customerName || "Conversa"}</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{selectedConversation.franchiseName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={selectedConversation.operationalStatus} />
                    {selectedConversation.channelType ? <StatusBadge status={selectedConversation.channelType} /> : null}
                    {selectedConversation.handoffStatus ? <StatusBadge status={selectedConversation.handoffStatus} /> : null}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => void runAction(() => startHumanTakeover(selectedConversation.id))} disabled={isActionLoading || selectedConversation.humanTakeoverActive || isConversationClosed} className="rounded-xl bg-white dark:bg-surface px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-line disabled:opacity-60">
                    Assumir humano
                  </button>
                  <button type="button" onClick={() => void runAction(() => stopHumanTakeover(selectedConversation.id))} disabled={isActionLoading || !selectedConversation.humanTakeoverActive || isConversationClosed} className="rounded-xl bg-white dark:bg-surface px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-line disabled:opacity-60">
                    Devolver para IA
                  </button>
                  <button type="button" onClick={() => void runAction(() => completeConversation(selectedConversation.id, { outcome: "CONCLUIDA", closedReason: "Atendimento encerrado" }))} disabled={isActionLoading || isConversationClosed} className="rounded-xl bg-white dark:bg-surface px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-line disabled:opacity-60">
                    Concluir atendimento
                  </button>
                  <button type="button" onClick={() => void runAction(() => completeConversation(selectedConversation.id, { outcome: "VENDA_CONCLUIDA", closedReason: "Venda fechada", saleSummary }))} disabled={isActionLoading || isConversationClosed || !saleSummary.trim()} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    Concluir venda
                  </button>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    {messages.length ? (
                      messages.map((message) => (
                        <article key={message.id} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role?.toUpperCase() === "USER" ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" : "ml-auto bg-ink text-white"}`}>
                          <p className="mb-1 text-xs opacity-60">{message.role?.toUpperCase() === "USER" ? "Cliente" : "Atendimento"}</p>
                          <p>{message.text || ""}</p>
                        </article>
                      ))
                    ) : (
                      <EmptyState icon={MessageSquareText} title="Sem mensagens" description="Nao ha mensagens para esta conversa." />
                    )}
                  </div>

                  <div className="card p-4">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Mensagem manual</p>
                    <textarea className="input-field mt-3 min-h-[96px] w-full" placeholder="Responder como atendimento humano" value={manualMessage} onChange={(event) => setManualMessage(event.target.value)} />
                    <div className="mt-3 flex justify-end">
                      <button type="button" onClick={() => void runAction(() => sendConversationManualMessage(selectedConversation.id, { message: manualMessage }))} disabled={isActionLoading || !manualMessage.trim() || !selectedConversation.humanTakeoverActive} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                        <Send size={16} />
                        Enviar mensagem
                      </button>
                    </div>
                  </div>
                </div>

                <aside className="grid gap-4">
                  <section className="card p-4">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Resumo comercial</p>
                    <textarea className="input-field mt-3 min-h-[140px] w-full" placeholder="Resumo que sera enviado ao WhatsApp do franqueado" value={saleSummary} onChange={(event) => setSaleSummary(event.target.value)} />
                  </section>

                  <section className="card p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-brand-700" />
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Auditoria de handoff</p>
                    </div>
                    {handoffs.length ? (
                      <div className="mt-4 grid gap-3">
                        {handoffs.map((handoff) => (
                          <div key={handoff.id} className="rounded-xl px-3 py-3 text-sm" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{handoff.deliveryStatus}</span>
                              <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{formatDate(handoff.sentAt)}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-line">{handoff.summary || "Sem resumo"}</p>
                            {handoff.deliveryError ? <p className="mt-2 text-rose-600 dark:text-rose-400">{handoff.deliveryError}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Bot} title="Sem handoff" description="Nenhum handoff comercial foi registrado ainda." />
                    )}
                  </section>
                </aside>
              </div>
            </div>
          ) : (
            <EmptyState icon={MessageSquareText} title="Selecione uma conversa" description="Escolha uma conversa na lista para abrir a inbox." />
          )}
        </section>
      </section>
    </AppShell>
  );
}
