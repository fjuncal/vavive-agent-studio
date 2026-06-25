"use client";

import { AppShell } from "@/components/AppShell";
import { AssistantAvatar } from "@/components/AssistantAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusDropdown, getStatusDisplay } from "@/components/StatusDropdown";
import {
  clearFranchiseAgent,
  getAgentSettings,
  getFranchiseAssistantConfiguration,
  getFranchiseById,
  getFranchiseGptMakerConnection,
  getGptMakerIntentions,
  getGptMakerTrainings,
  getTransferRules,
  getIdleActions,
  syncAgentStatus,
  inactivateAgent,
  activateAgent,
  type FranchiseAssistantConfiguration,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerIntention,
  type AgentSyncStatus,
} from "@/lib/api";
import {
  ArrowRightLeft, Bot, BookOpen, Briefcase, MessageSquare, MoreVertical, Settings, Target, Trash2, PowerOff, User, Zap, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getMultiAvatarUrl(seed: string): string {
  const hash = hashCode(seed);
  // Use DiceBear API which supports CORS and generates cartoon-style avatars
  const styles = ["adventurer", "adventurer-neutral", "avataaars", "big-ears", "bottts", "fun-emoji", "lorelei", "micah", "miniavs", "notionists", "open-peeps", "personas", "pixel-art"];
  const style = styles[hash % styles.length];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${hash}`;
}

function AgentMenu({ onEdit, onToggleStatus, onRemove, isActive }: { onEdit: () => void; onToggleStatus: () => void; onRemove: () => void; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <MoreVertical size={18} style={{ color: "var(--color-text-secondary)" }} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border shadow-lg" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-primary)" }}>
          <button type="button" onClick={() => { onEdit(); setOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:opacity-80 transition" style={{ color: "var(--color-text-primary)" }}>
            <Settings size={14} /> Editar configuracao
          </button>
          <button type="button" onClick={() => { onToggleStatus(); setOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:opacity-80 transition" style={{ color: "var(--color-text-primary)" }}>
            {isActive ? <PowerOff size={14} /> : <RefreshCw size={14} />}
            {isActive ? "Inativar agente" : "Ativar agente"}
          </button>
          <button type="button" onClick={() => { onRemove(); setOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
            <Trash2 size={14} /> Remover agente
          </button>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, className = "" }: { icon: typeof Bot; label: string; value: string | React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--color-bg-secondary)" }}>
        <Icon size={16} style={{ color: "var(--color-text-secondary)" }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-tertiary)" }}>{label}</p>
        <div className="mt-0.5 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{value}</div>
      </div>
    </div>
  );
}

export default function FranchiseAgentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [configuration, setConfiguration] = useState<FranchiseAssistantConfiguration | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [trainings, setTrainings] = useState<Array<{ id?: string; type?: string; text?: string; title?: string; content?: string }>>([]);
  const [intentions, setIntentions] = useState<GptMakerIntention[]>([]);
  const [transferRules, setTransferRules] = useState<unknown[]>([]);
  const [idleActions, setIdleActions] = useState<unknown[]>([]);
  const [syncStatus, setSyncStatus] = useState<AgentSyncStatus | null>(null);
  const [agentStatusState, setAgentStatusState] = useState<string>("ATIVA");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "clear-agent">(null);

  useEffect(() => {
    if (!params?.id) return;
    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseAssistantConfiguration(params.id),
      getAgentSettings(params.id).catch(() => ({})),
      getGptMakerTrainings(params.id).catch(() => []),
      getGptMakerIntentions(params.id).catch(() => []),
      getTransferRules(params.id).catch(() => []),
      getIdleActions(params.id).catch(() => []),
    ])
      .then(([franchiseData, connectionData, assistantConfiguration, settingsData, trainingsData, intentionsData, transferData, idleData]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setConfiguration(assistantConfiguration);
        setSettings(settingsData);
        setTrainings(Array.isArray(trainingsData) ? trainingsData as Array<{ id?: string; type?: string; text?: string; title?: string; content?: string }> : []);
        setIntentions(Array.isArray(intentionsData) ? intentionsData : []);
        setTransferRules(Array.isArray(transferData) ? transferData : []);
        setIdleActions(Array.isArray(idleData) ? idleData : []);
        setSyncStatus({
          status: connectionData.status || franchiseData.status || "ATIVA",
          agentId: connectionData.agentId ?? null,
          agentName: connectionData.agentName ?? null,
          syncedAt: connectionData.lastSyncAt ?? undefined,
        });
        setAgentStatusState(connectionData.status || franchiseData.status || "ATIVA");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar dados."))
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  const hasAgent = !!connection?.agentId;
  const hasWorkspace = !!connection?.workspaceId;

  const roleBlock = configuration?.blocks.find((b) => b.blockType === "ROLE");
  const behaviorBlock = configuration?.blocks.find((b) => b.blockType === "BEHAVIOR");
  const role = (roleBlock?.payload ?? {}) as Record<string, unknown>;
  const behavior = (behaviorBlock?.payload ?? {}) as Record<string, unknown>;

  const agentDisplayName = (connection?.agentName as string) || (role.assistantName as string) || franchise?.name || "Assistente";
  const communicationLabel = (() => {
    const ct = (role.communicationType as string) || "NORMAL";
    return ct === "FORMAL" ? "Formal" : ct === "RELAXED" ? "Descontraida" : "Normal";
  })();
  const objectiveLabel = (() => {
    const t = (role.type as string) || "SALE";
    return t === "SALE" ? "Vendas" : t === "SUPPORT" ? "Suporte" : "Uso pessoal";
  })();
  const behaviorText = (behavior.instruction as string) || "";
  const jobSite = (role.jobSite as string) || "";
  const jobDescription = (role.description as string) || "";

  // Determine agent status from sync or local data
  const agentStatus = agentStatusState;
  const statusConfig = getStatusDisplay(agentStatus);

  async function handleToggleStatus() {
    if (!params?.id) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const isActive = agentStatus === "ATIVA" || agentStatus === "ATIVO";
      if (isActive) {
        await inactivateAgent(params.id);
        setSyncStatus((prev) => prev ? { ...prev, status: "INATIVA" } : null);
        setAgentStatusState("INATIVA");
        setSuccess("Agente inativado.");
      } else {
        await activateAgent(params.id);
        setSyncStatus((prev) => prev ? { ...prev, status: "ATIVA" } : null);
        setAgentStatusState("ATIVA");
        setSuccess("Agente ativado.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar status do agente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClearAgent() {
    if (!params?.id) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await clearFranchiseAgent(params.id, { confirmCriticalChange: true });
      setConnection((prev) => prev ? { ...prev, agentId: null, agentName: null } : null);
      setConfirmAction(null);
      setSuccess("Assistente removido.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover assistente.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader eyebrow="Assistente" title="Carregando..." />
        <section className="card p-6">
          <div className="flex items-center gap-3">
            <RefreshCw size={16} className="animate-spin" style={{ color: "var(--color-text-tertiary)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando configuracao do assistente...</p>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Assistente"
        title={agentDisplayName}
        description={hasAgent ? `${communicationLabel} | ${objectiveLabel}` : "Configure o assistente da sua franquia."}
      />

      {error && <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 mb-4">{error}</p>}
      {success && <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 mb-4">{success}</p>}

      {!hasWorkspace ? (
        <section className="card p-6">
          <p className="rounded-2xl p-4 text-sm" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
            Vincule um workspace na tela da franquia antes de criar o assistente.
          </p>
          <Link href={`/franquias/${params?.id}`} className="btn-primary mt-4 inline-flex">Ir para franquia</Link>
        </section>
      ) : !hasAgent ? (
        <section className="card p-6 text-center">
          <Bot size={48} className="mx-auto mb-4" style={{ color: "var(--color-text-tertiary)" }} />
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Nenhum assistente configurado</h3>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Crie um assistente para comecar a atender seus clientes.</p>
          <Link href={`/franquias/${params?.id}/agente/novo`} className="btn-primary mt-4 inline-flex">Criar assistente</Link>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Coluna principal */}
          <div className="space-y-6">
            {/* Header do agente */}
            <section className="card p-5">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <AssistantAvatar
                    src={getMultiAvatarUrl(agentDisplayName)}
                    alt={agentDisplayName}
                    fallbackLabel={agentDisplayName}
                    className="h-20 w-20 shrink-0 rounded-2xl"
                  />
                  <div
                    className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2"
                    style={{ backgroundColor: statusConfig.color, borderColor: "var(--color-bg-primary)" }}
                    title={statusConfig.label}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{agentDisplayName}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusDropdown
                          currentStatus={agentStatus}
                          onChange={async (newStatus) => {
                            if (!params?.id) return;
                            setIsSaving(true);
                            try {
                              if (newStatus === "ATIVA") {
                                await activateAgent(params.id);
                                setAgentStatusState("ATIVA");
                              } else if (newStatus === "INATIVA") {
                                await inactivateAgent(params.id);
                                setAgentStatusState("INATIVA");
                              }
                              // TRAINING is intentionally disabled for now. GPTMaker rejects this update with the current token/API contract.
                              setSuccess(`Status alterado para ${newStatus === "ATIVA" ? "Ativo" : newStatus === "TRAINING" ? "Treinamento" : "Desativado"}.`);
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Erro ao alterar status do agente.");
                            } finally {
                              setIsSaving(false);
                            }
                          }}
                          disabled={isSaving}
                        />
                        <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>|</span>
                        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{franchise?.name}</span>
                      </div>
                      {syncStatus?.syncedAt && (
                        <p className="text-xs mt-1 flex items-center gap-2" style={{ color: "var(--color-text-tertiary)" }}>
                          Sincronizado: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(syncStatus.syncedAt))}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!params?.id) return;
                              try {
                                const result = await syncAgentStatus(params.id);
                                setSyncStatus(result);
                              } catch (e) {
                                setError("Erro ao sincronizar status.");
                              }
                            }}
                            className="text-brand-600 hover:text-brand-700 underline"
                          >
                            Atualizar
                          </button>
                        </p>
                      )}
                    </div>
                    <AgentMenu
                      onEdit={() => router.push(`/franquias/${params?.id}/agente/configuracao`)}
                      onToggleStatus={handleToggleStatus}
                      onRemove={() => setConfirmAction("clear-agent")}
                      isActive={agentStatus === "ATIVA" || agentStatus === "ATIVO"}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/franquias/${params?.id}/agente/configuracao`} className="btn-primary text-xs">
                      <Settings size={14} /> Configurar
                    </Link>
                    <Link href={`/franquias/${params?.id}/agente/novo`} className="btn-secondary text-xs">
                      <RefreshCw size={14} /> Recriar
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Perfil */}
            <section className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={18} className="text-brand-500" />
                <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Perfil</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon={MessageSquare} label="Comunicacao" value={communicationLabel} />
                <InfoCard icon={Briefcase} label="Finalidade" value={objectiveLabel} />
                {jobSite && <InfoCard icon={Briefcase} label="Site" value={jobSite} />}
              </div>
              {behaviorText && (
                <div className="mt-4 rounded-xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--color-text-tertiary)" }}>Comportamento</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-primary)" }}>{behaviorText}</p>
                </div>
              )}
              {jobDescription && (
                <div className="mt-3 rounded-xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--color-text-tertiary)" }}>Descricao</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-primary)" }}>{jobDescription}</p>
                </div>
              )}
            </section>

            {/* Treinamentos */}
            <section className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-brand-500" />
                  <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Treinamentos</h3>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>{trainings.length}</span>
                </div>
              </div>
              {trainings.length > 0 ? (
                <div className="space-y-2">
                  {trainings.map((t, i) => (
                    <div key={t.id ?? i} className="rounded-xl p-3" style={{ background: "var(--color-bg-secondary)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--color-bg-primary)", color: "var(--color-text-tertiary)" }}>{t.type || "TEXT"}</span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>{t.text || t.content || t.title || "Treinamento"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhum treinamento cadastrado.</p>
              )}
            </section>

            {/* Intencoes */}
            <section className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-brand-500" />
                  <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Intencoes</h3>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>{intentions.length}</span>
                </div>
              </div>
              {intentions.length > 0 ? (
                <div className="space-y-2">
                  {intentions.map((intent) => (
                    <div key={intent.id} className="rounded-xl p-3" style={{ background: "var(--color-bg-secondary)" }}>
                      <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{intent.description}</p>
                      {intent.instructions && <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{intent.instructions}</p>}
                      <div className="flex gap-2 mt-2">
                        <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--color-bg-primary)", color: "var(--color-text-tertiary)" }}>{intent.type}</span>
                        {intent.url && <span className="rounded-full px-2 py-0.5 text-xs truncate max-w-[200px]" style={{ background: "var(--color-bg-primary)", color: "var(--color-text-tertiary)" }}>{intent.url}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma intencao cadastrada.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Configuracoes tecnicas */}
            <section className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-brand-500" />
                <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Configuracoes</h3>
              </div>
              <div className="space-y-3">
                <InfoCard icon={Settings} label="Modelo" value={String(settings.prefferModel ?? "GPT_4_O")} />
                <InfoCard icon={Settings} label="Timezone" value={String(settings.timezone ?? "America/Sao_Paulo")} />
                <div className="flex flex-wrap gap-2 mt-2">
                  {Boolean(settings.enabledHumanTransfer) && <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>Transf. humana</span>}
                  {Boolean(settings.enabledEmoji) && <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>Emojis</span>}
                  {Boolean(settings.signMessages) && <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>Assinar</span>}
                  {Boolean(settings.limitSubjects) && <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>Limitar assuntos</span>}
                  {Boolean(settings.splitMessages) && <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>Separar msgs</span>}
                  {Boolean(settings.enabledReminder) && <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>Lembretes</span>}
                </div>
              </div>
            </section>

            {/* Regras de transferencia */}
            <section className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft size={18} className="text-brand-500" />
                <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Transferencia</h3>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>{transferRules.length}</span>
              </div>
              {transferRules.length > 0 ? (
                <div className="space-y-2">
                  {(transferRules as Array<Record<string, unknown>>).slice(0, 3).map((rule, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: "var(--color-bg-secondary)" }}>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{String(rule.instructions ?? rule.description ?? "Regra")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma regra.</p>
              )}
            </section>

            {/* Acoes de inatividade */}
            <section className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <PowerOff size={18} className="text-brand-500" />
                <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Inatividade</h3>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>{idleActions.length}</span>
              </div>
              {idleActions.length > 0 ? (
                <div className="space-y-2">
                  {(idleActions as Array<Record<string, unknown>>).slice(0, 3).map((action, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: "var(--color-bg-secondary)" }}>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{String(action.instructions ?? action.description ?? "Acao")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma acao.</p>
              )}
            </section>

            {/* Acessos rapidos */}
            <section className="card p-5">
              <h3 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Acessos rapidos</h3>
              <div className="grid gap-2">
                <Link href="/conversas" className="rounded-xl px-4 py-3 text-sm font-medium hover:opacity-80 transition" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-primary)" }}>
                  <div className="flex items-center gap-2"><MessageSquare size={16} /> Testar atendimento</div>
                </Link>
                <Link href={`/franquias/${franchise?.id}/agente/configuracao`} className="rounded-xl px-4 py-3 text-sm font-medium hover:opacity-80 transition" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-primary)" }}>
                  <div className="flex items-center gap-2"><Settings size={16} /> Configuracoes</div>
                </Link>
              </div>
            </section>
          </aside>
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={confirmAction === "clear-agent"}
        title="Remover assistente"
        description="Esta acao remove o assistente permanentemente da plataforma e do sistema. Todas as configuracoes, treinamentos e intencoes serao perdidos."
        confirmText="remover"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleClearAgent()}
      />
    </AppShell>
  );
}
