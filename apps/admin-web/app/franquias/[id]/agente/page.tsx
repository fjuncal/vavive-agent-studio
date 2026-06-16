"use client";

import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import {
  clearFranchiseAgent,
  getAgents,
  getDefaultAgentTexts,
  getFranchiseById,
  getFranchiseDefaultContext,
  getFranchiseGptMakerConnection,
  getGptMakerWorkspaceAgents,
  provisionFranchiseGptMakerAgent,
  updateFranchiseGptMakerConnection,
  type AgentSummary,
  type DefaultAgentText,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerAgentOption
} from "@/lib/api";
import { Bot, ExternalLink, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const avatarOptions = [
  { label: "Profissional feminina", value: "https://assets.vavive.com/avatar-profissional-feminino.png" },
  { label: "Profissional masculino", value: "https://assets.vavive.com/avatar-profissional-masculino.png" },
  { label: "Neutro Vavive", value: "https://assets.vavive.com/avatar-neutro-vavive.png" },
  { label: "Sem avatar", value: "" }
];

function buildPreview(baseContext: string, selectedTexts: DefaultAgentText[]) {
  const selectedContent = selectedTexts
    .map((item) => `${item.title}\n${item.content}`)
    .join("\n\n");
  if (!selectedContent) {
    return baseContext;
  }
  return `${baseContext}\n\nTEXTOS PADRAO APLICADOS\n${selectedContent}`.trim();
}

export default function FranchiseAgentPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [localAgent, setLocalAgent] = useState<AgentSummary | null>(null);
  const [defaultTexts, setDefaultTexts] = useState<DefaultAgentText[]>([]);
  const [workspaceAgents, setWorkspaceAgents] = useState<GptMakerAgentOption[]>([]);
  const [selectedTextIds, setSelectedTextIds] = useState<string[]>([]);
  const [selectedExistingAgentId, setSelectedExistingAgentId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [preview, setPreview] = useState("");
  const [baseContext, setBaseContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "replace-agent" | "clear-agent">(null);

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseDefaultContext(params.id),
      getDefaultAgentTexts(),
      getAgents().catch(() => [])
    ])
      .then(([franchiseData, connectionData, contextData, texts, agents]) => {
        const activeTexts = texts.filter((item) => item.active);
        const local = agents.find((item) => item.franchiseId === franchiseData.id) ?? null;
        setFranchise(franchiseData);
        setConnection(connectionData);
        setLocalAgent(local);
        setDefaultTexts(activeTexts);
        setSelectedTextIds(activeTexts.map((item) => item.id));
        setBaseContext(contextData.context);
        setPreview(buildPreview(contextData.context, activeTexts));
        setAgentName(connectionData.agentName ?? `Assistente Vavive - ${franchiseData.name}`);
        setSelectedAvatar(local?.avatar ?? "");
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar a configuração do agente.");
      })
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  useEffect(() => {
    if (!isSuperAdmin || !connection?.workspaceId) {
      setWorkspaceAgents([]);
      setSelectedExistingAgentId("");
      return;
    }

    getGptMakerWorkspaceAgents(connection.workspaceId)
      .then((items) => {
        setWorkspaceAgents(items);
        setSelectedExistingAgentId(items[0]?.id ?? "");
      })
      .catch(() => {
        setWorkspaceAgents([]);
        setSelectedExistingAgentId("");
      });
  }, [connection?.workspaceId, isSuperAdmin]);

  function toggleText(textId: string) {
    setSelectedTextIds((current) => current.includes(textId) ? current.filter((item) => item !== textId) : [...current, textId]);
  }

  function applySelectedTexts() {
    const selectedTexts = defaultTexts.filter((item) => selectedTextIds.includes(item.id));
    setPreview(buildPreview(baseContext, selectedTexts));
  }

  async function handleProvisionAgent(forceReplace: boolean) {
    if (!params?.id || !connection?.workspaceId) {
      setError("Vincule uma integração antes de configurar o agente.");
      setSuccess(null);
      return;
    }
    if (!agentName.trim()) {
      setError("Informe o nome do agente.");
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await provisionFranchiseGptMakerAgent(params.id, {
        workspaceId: connection.workspaceId,
        workspaceName: connection.workspaceName ?? undefined,
        agentName,
        avatar: selectedAvatar || undefined,
        communicationType,
        type: objectiveType,
        jobName: franchise?.name ?? "Vavive",
        jobSite: "https://vavive.com.br",
        jobDescription: preview,
        confirmCriticalChange: forceReplace
      });
      setConnection(response);
      setSuccess(response.agentId ? "Agente configurado com sucesso." : "Configuração salva.");
      const agents = await getAgents();
      setLocalAgent(agents.find((item) => item.franchiseId === franchise?.id) ?? null);
      setConfirmAction(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível configurar o agente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLinkExistingAgent() {
    if (!params?.id || !connection?.workspaceId || !selectedExistingAgentId) {
      setError("Selecione um agente existente.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await updateFranchiseGptMakerConnection(params.id, {
        workspaceId: connection.workspaceId,
        agentId: selectedExistingAgentId,
        confirmCriticalChange: true
      });
      setConnection(response);
      setSuccess("Agente vinculado.");
      setConfirmAction(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível vincular o agente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClearAgent() {
    if (!params?.id) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await clearFranchiseAgent(params.id, { confirmCriticalChange: true });
      setConnection(response);
      setLocalAgent(null);
      setConfirmAction(null);
      setSuccess("Agente removido.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível remover o agente.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedTexts = defaultTexts.filter((item) => selectedTextIds.includes(item.id));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Agente"
        title={franchise ? `Agente - ${franchise.name}` : "Agente da franquia"}
        description="Configure o agente, revise o contexto e gerencie treinamentos."
      />

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      {isLoading ? (
        <section className="rounded-2xl border border-line/80 bg-white/86 p-6 shadow-soft">
          <p className="text-sm text-slate-500">Carregando...</p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <section className="grid gap-5">
            <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              {!connection?.workspaceId ? (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                  {isSuperAdmin ? "Vincule uma integração na tela da franquia antes de criar o agente." : "Aguardando configuração pela administração."}
                </p>
              ) : (
                <>
                  {connection?.agentId && localAgent ? (
                    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                      {localAgent.avatar ? (
                        <img src={localAgent.avatar} alt={localAgent.name} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-line" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                          <Bot size={24} />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-ink">{localAgent.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{localAgent.connectionStatus}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link href={`/conversas`} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                            <MessageSquare size={14} /> Testar agente
                          </Link>
                          <Link href={`/franquias/${franchise?.id}/agente/treinamentos`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-line">
                            <FileText size={14} /> Treinamentos
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isSuperAdmin ? (
                    <>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <label className="grid gap-1.5">
                          <span className="text-sm font-medium text-slate-700">Nome do agente</span>
                          <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={agentName} onChange={(event) => setAgentName(event.target.value)} />
                        </label>
                        <label className="grid gap-1.5">
                          <span className="text-sm font-medium text-slate-700">Tom de voz</span>
                          <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={communicationType} onChange={(event) => setCommunicationType(event.target.value as "FORMAL" | "NORMAL" | "RELAXED")}>
                            <option value="FORMAL">Formal</option>
                            <option value="NORMAL">Normal</option>
                            <option value="RELAXED">Leve</option>
                          </select>
                        </label>
                        <label className="grid gap-1.5">
                          <span className="text-sm font-medium text-slate-700">Objetivo</span>
                          <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={objectiveType} onChange={(event) => setObjectiveType(event.target.value as "SUPPORT" | "SALE" | "PERSONAL")}>
                            <option value="SALE">Comercial</option>
                            <option value="SUPPORT">Suporte</option>
                            <option value="PERSONAL">Personalizado</option>
                          </select>
                        </label>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {avatarOptions.map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => setSelectedAvatar(option.value)}
                            className={`rounded-2xl border p-3 text-left transition ${selectedAvatar === option.value ? "border-brand-500 bg-brand-50 ring-4 ring-brand-50" : "border-line bg-white hover:bg-slate-50"}`}
                          >
                            {option.value ? (
                              <img src={option.value} alt={option.label} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-line" />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-500">Sem foto</div>
                            )}
                            <span className="mt-3 block text-sm font-semibold text-ink">{option.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 grid gap-4">
                        <div className="rounded-2xl border border-line/80 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-semibold text-ink">Textos padrão aplicados</h3>
                              <p className="mt-1 text-sm text-slate-500">Selecione os textos que irão compor o contexto final do agente.</p>
                            </div>
                            <button type="button" onClick={applySelectedTexts} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-line">
                              Atualizar preview
                            </button>
                          </div>
                          <div className="mt-4 grid gap-3">
                            {defaultTexts.map((item) => (
                              <label key={item.id} className="rounded-xl bg-white p-4 text-sm text-slate-600 ring-1 ring-line">
                                <div className="flex items-start gap-3">
                                  <input type="checkbox" checked={selectedTextIds.includes(item.id)} onChange={() => toggleText(item.id)} className="mt-1" />
                                  <div>
                                    <p className="font-semibold text-ink">{item.title}</p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">{item.category.replaceAll("_", " ")}</p>
                                    <p className="mt-2 whitespace-pre-line leading-6">{item.content}</p>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-medium text-slate-700">Contexto final</span>
                          <textarea className="min-h-[260px] rounded-2xl border border-line bg-white px-3 py-3 text-sm leading-6 text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={preview} onChange={(event) => setPreview(event.target.value)} />
                        </label>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => connection?.agentId ? setConfirmAction("replace-agent") : void handleProvisionAgent(false)}
                          disabled={isSaving}
                          className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {isSaving ? "Salvando..." : connection?.agentId ? "Reconfigurar agente" : "Criar agente"}
                        </button>
                        {localAgent ? (
                          <Link href={`/agentes/${localAgent.id}/treinamentos`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line">
                            Treinamentos
                          </Link>
                        ) : null}
                      </div>

                      <details className="mt-5 rounded-2xl border border-line/80 bg-slate-50 p-4">
                        <summary className="cursor-pointer text-sm font-semibold text-ink">Opções avançadas</summary>
                        <div className="mt-4 grid gap-4">
                          <p className="text-sm text-slate-500">Vincular agente existente na integração.</p>
                          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                            <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={selectedExistingAgentId} onChange={(event) => setSelectedExistingAgentId(event.target.value)}>
                              <option value="">Selecione um agente</option>
                              {workspaceAgents.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                              ))}
                            </select>
                            <button type="button" onClick={() => void handleLinkExistingAgent()} disabled={isSaving || !selectedExistingAgentId} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line disabled:opacity-60">
                              Vincular
                            </button>
                          </div>
                          {connection?.agentId ? (
                            <button type="button" onClick={() => setConfirmAction("clear-agent")} className="w-fit rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line">
                              Remover agente
                            </button>
                          ) : null}
                        </div>
                      </details>
                    </>
                  ) : null}
                </>
              )}
            </section>
          </section>

          <aside className="grid gap-5">
            <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <h2 className="font-semibold text-ink">Resumo</h2>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <p className="rounded-xl bg-slate-50 p-3">Franquia: <strong className="text-ink">{franchise?.name ?? "-"}</strong></p>
                <p className="rounded-xl bg-slate-50 p-3">Status: <strong className="text-ink">{franchise?.status?.replaceAll("_", " ") ?? "-"}</strong></p>
                <p className="rounded-xl bg-slate-50 p-3">Agente: <strong className="text-ink">{connection?.agentName ?? "Não configurado"}</strong></p>
              </div>
            </section>

            <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <h2 className="font-semibold text-ink">Ações</h2>
              <div className="mt-4 grid gap-3">
                {connection?.agentId ? (
                  <>
                    <Link href="/conversas" className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-slate-100">
                      <MessageSquare size={16} />
                      Testar agente
                    </Link>
                    {localAgent ? (
                    <Link href={`/agentes/${localAgent.id}/treinamentos`} className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-slate-100">
                      <FileText size={16} />
                      Treinamentos
                    </Link>
                    ) : null}
                  </>
                ) : null}
                <Link href={`/franquias/${franchise?.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-slate-100">
                  <ExternalLink size={16} />
                  Voltar para franquia
                </Link>
              </div>
            </section>
          </aside>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmAction !== null}
        isSubmitting={isSaving}
        title="Confirmar alteração"
        description="Essa ação pode afetar o agente configurado. Confirme para continuar."
        confirmLabel="Confirmar"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "clear-agent") {
            void handleClearAgent();
            return;
          }
          void handleProvisionAgent(true);
        }}
      />
    </AppShell>
  );
}
