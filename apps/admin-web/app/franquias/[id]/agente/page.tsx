"use client";

import { AppShell } from "@/components/AppShell";
import { AssistantAvatar, buildAssistantAvatarDataUri } from "@/components/AssistantAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageHeader } from "@/components/PageHeader";
import {
  clearFranchiseAgent,
  getFranchiseAssistantConfiguration,
  getFranchiseById,
  getFranchiseDefaultContext,
  getFranchiseGptMakerConnection,
  getGptMakerWorkspaceAgents,
  provisionFranchiseGptMakerAgent,
  updateFranchiseGptMakerConnection,
  type FranchiseAssistantConfiguration,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerAgentOption
} from "@/lib/api";
import { Bot, ExternalLink, FileText, MessageSquare, Settings, Target } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const avatarOptions = [
  { label: "Atendimento", value: buildAssistantAvatarDataUri("#EEF2FF", "#4F46E5", "AT") },
  { label: "Comercial", value: buildAssistantAvatarDataUri("#ECFDF5", "#047857", "CO") },
  { label: "Suporte", value: buildAssistantAvatarDataUri("#FFF7ED", "#C2410C", "SU") },
  { label: "Sem avatar", value: "" }
];

export default function FranchiseAgentPage() {
  const params = useParams<{ id: string }>();
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [configuration, setConfiguration] = useState<FranchiseAssistantConfiguration | null>(null);
  const [workspaceAgents, setWorkspaceAgents] = useState<GptMakerAgentOption[]>([]);
  const [selectedExistingAgentId, setSelectedExistingAgentId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [selectedAvatar, setSelectedAvatar] = useState("");
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
      getFranchiseAssistantConfiguration(params.id)
    ])
      .then(([franchiseData, connectionData, contextData, assistantConfiguration]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setConfiguration(assistantConfiguration);
        setBaseContext(contextData.context);
        setAgentName(connectionData.agentName ?? `Assistente Vavive - ${franchiseData.name}`);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar configuracao do assistente.");
      })
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  useEffect(() => {
    if (!connection?.workspaceId) {
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
  }, [connection?.workspaceId]);

  const blockSummary = useMemo(() => {
    return configuration?.blocks.map((block) => ({
      title: block.title,
      mode: block.mode === "STANDARD" ? "Padrao da matriz" : "Personalizado"
    })) ?? [];
  }, [configuration]);

  async function handleProvisionAgent(forceReplace: boolean) {
    if (!params?.id || !connection?.workspaceId) {
      setError("Vincule um workspace antes de configurar o assistente.");
      return;
    }
    if (!agentName.trim()) {
      setError("Informe o nome do assistente.");
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
        jobDescription: baseContext,
        confirmCriticalChange: forceReplace
      });
      setConnection(response);
      setSuccess(response.agentId ? "Assistente configurado com sucesso." : "Configuracao salva.");
      setConfirmAction(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel configurar o assistente.");
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
      setSuccess("Assistente vinculado.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel vincular o assistente.");
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
      setConfirmAction(null);
      setSuccess("Assistente removido.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel remover o assistente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Assistente"
        title={franchise ? `Assistente - ${franchise.name}` : "Assistente da franquia"}
        description="Revisao operacional, provisionamento e acessos rapidos do Assistente Vavive."
      />

      {error ? <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{success}</p> : null}

      {isLoading ? (
        <section className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando...</p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="grid gap-5">
            <section className="card">
              {!connection?.workspaceId ? (
                <p className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 p-4 text-sm text-amber-800 dark:text-amber-300">
                  Vincule um workspace na tela da franquia antes de criar o assistente.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
                    <AssistantAvatar src={selectedAvatar || undefined} alt={agentName} fallbackLabel={agentName} className="h-16 w-16 object-cover ring-1 ring-line" />
                    <div>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{connection?.agentName ?? agentName}</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {connection?.agentId ? "Assistente ativo na unidade." : "Assistente ainda nao provisionado."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href="/setup-guiado" className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                          <Settings size={14} /> Workbench
                        </Link>
                        <Link href={`/franquias/${franchise?.id}/agente/intencoes`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-line">
                          <Target size={14} /> Intencoes
                        </Link>
                        <Link href={`/franquias/${franchise?.id}/agente/configuracoes`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-line">
                          <ExternalLink size={14} /> Configuracoes
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-slate-700">Nome do assistente</span>
                      <input className="input-field" value={agentName} onChange={(event) => setAgentName(event.target.value)} />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-slate-700">Tom de voz</span>
                      <select className="input-field" value={communicationType} onChange={(event) => setCommunicationType(event.target.value as "FORMAL" | "NORMAL" | "RELAXED")}>
                        <option value="FORMAL">Formal</option>
                        <option value="NORMAL">Normal</option>
                        <option value="RELAXED">Leve</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-slate-700">Objetivo</span>
                      <select className="input-field" value={objectiveType} onChange={(event) => setObjectiveType(event.target.value as "SUPPORT" | "SALE" | "PERSONAL")}>
                        <option value="SALE">Vendas</option>
                        <option value="SUPPORT">Suporte</option>
                        <option value="PERSONAL">Uso proprio</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {avatarOptions.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setSelectedAvatar(option.value)}
                        className={`rounded-2xl border p-3 text-left transition ${selectedAvatar === option.value ? "border-brand-500 bg-brand-50 ring-4 ring-brand-50" : "border-line bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                      >
                        {option.value ? (
                          <AssistantAvatar src={option.value} alt={option.label} fallbackLabel={option.label} className="h-16 w-16 object-cover ring-1 ring-line" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Sem foto</div>
                        )}
                        <span className="mt-3 block text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{option.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => connection?.agentId ? setConfirmAction("replace-agent") : void handleProvisionAgent(false)}
                      disabled={isSaving}
                      className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSaving ? "Salvando..." : connection?.agentId ? "Reconfigurar assistente" : "Criar assistente"}
                    </button>
                    {connection?.agentId ? (
                      <button type="button" onClick={() => setConfirmAction("clear-agent")} className="btn-secondary">
                        Limpar assistente
                      </button>
                    ) : null}
                  </div>

                  {workspaceAgents.length ? (
                    <details className="mt-5 rounded-2xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
                      <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Vincular assistente ja existente</summary>
                      <div className="mt-4 grid gap-4">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                          <select className="input-field" value={selectedExistingAgentId} onChange={(event) => setSelectedExistingAgentId(event.target.value)}>
                            <option value="">Selecione um assistente</option>
                            {workspaceAgents.map((agent) => (
                              <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => void handleLinkExistingAgent()} disabled={isSaving || !selectedExistingAgentId} className="btn-primary">
                            Vincular
                          </button>
                        </div>
                      </div>
                    </details>
                  ) : null}
                </>
              )}
            </section>
          </section>

          <aside className="grid gap-5">
            <section className="card">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Blocos ativos</h2>
              <div className="mt-4 grid gap-3">
                {blockSummary.map((item) => (
                  <div key={item.title} className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                    <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{item.mode}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Acessos rapidos</h2>
              <div className="mt-4 grid gap-3">
                <Link href="/conversas" className="rounded-xl px-4 py-3 ring-1 ring-line" style={{ color: "var(--color-text-primary)" }}>
                  <div className="flex items-center gap-2"><MessageSquare size={16} /> Testar atendimento</div>
                </Link>
                <Link href={`/franquias/${franchise?.id}/agente/intencoes`} className="rounded-xl px-4 py-3 ring-1 ring-line" style={{ color: "var(--color-text-primary)" }}>
                  <div className="flex items-center gap-2"><Target size={16} /> Intencoes</div>
                </Link>
                <Link href={`/franquias/${franchise?.id}/agente/configuracoes`} className="rounded-xl px-4 py-3 ring-1 ring-line" style={{ color: "var(--color-text-primary)" }}>
                  <div className="flex items-center gap-2"><FileText size={16} /> Configuracoes tecnicas</div>
                </Link>
              </div>
            </section>
          </aside>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmAction === "replace-agent"}
        title="Reconfigurar assistente"
        description="Esta acao substitui configuracao atual do assistente da unidade."
        confirmLabel="Reconfigurar"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleProvisionAgent(true)}
      />
      <ConfirmDialog
        isOpen={confirmAction === "clear-agent"}
        title="Limpar assistente"
        description="Esta acao remove o assistente atual da unidade."
        confirmLabel="Remover"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleClearAgent()}
      />
    </AppShell>
  );
}
