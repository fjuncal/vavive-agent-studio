"use client";

import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import {
  clearFranchiseAgent,
  createFranchiseAdminUser,
  getAvailableGptMakerWorkspaces,
  getConversationMessages,
  getConversations,
  getWorkspaceCredits,
  getFranchiseAdminUser,
  getFranchiseById,
  getFranchiseChannels,
  getFranchiseGptMakerConnection,
  getFranchiseSetup,
  linkFranchiseWorkspace,
  unlinkFranchiseWorkspace,
  type ConversationSummary,
  type FranchiseAdminUser,
  type FranchiseChannel,
  type FranchiseGptMakerConnection,
  type FranchiseSetup,
  type FranchiseSummary,
  type GptMakerWorkspaceOption
} from "@/lib/api";
import {
  Bot,
  Building2,
  Loader2,
  MessageCircle,
  PlugZap,
  Radio,
  UserRound,
  ArrowRight,
  Settings,
  Zap,
  Link2,
  Unlink,
  Trash2,
  Save,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function InfoCard({
  icon: Icon,
  title,
  value,
  subtitle,
  action,
  variant = "default"
}: {
  icon: typeof Building2;
  title: string;
  value: string;
  subtitle?: string;
  action?: { label: string; href: string };
  variant?: "default" | "success" | "warning";
}) {
  const variantStyles = {
    default: "border-line/60",
    success: "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/30",
    warning: "border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/30"
  };

  return (
    <article className={`card group ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-200 group-hover:scale-110">
          <Icon size={20} />
        </div>
        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {action.label}
            <ArrowRight size={12} />
          </Link>
        )}
      </div>
      <h3 className="mt-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{value}</p>
      {subtitle && <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>{subtitle}</p>}
    </article>
  );
}

function SectionHeader({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
        {description && <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{description}</p>}
      </div>
    </div>
  );
}

export default function FranchiseDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [setup, setSetup] = useState<FranchiseSetup | null>(null);
  const [adminUser, setAdminUser] = useState<FranchiseAdminUser | null>(null);
  const [channels, setChannels] = useState<FranchiseChannel[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [workspaces, setWorkspaces] = useState<GptMakerWorkspaceOption[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [credits, setCredits] = useState<{ credits: number; used: number; remaining: number } | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | "replace-workspace" | "unlink-workspace" | "clear-agent">(null);

  const selectedWorkspace = useMemo(
    () => workspaces.find((item) => item.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces]
  );

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseSetup(params.id),
      getFranchiseAdminUser(params.id).catch(() => null),
      getFranchiseChannels(params.id).catch(() => []),
      getConversations({ franchiseId: params.id }).catch(() => [])
    ])
      .then(([franchiseData, connectionData, setupData, adminData, channelData, conversationData]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setSetup(setupData);
        setAdminUser(adminData);
        setChannels(channelData);
        setConversations(conversationData);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar a franquia.");
      })
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }
    getAvailableGptMakerWorkspaces().then(setWorkspaces).catch(() => setWorkspaces([]));
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!connection?.workspaceId || !params?.id) {
      setCredits(null);
      return;
    }
    getWorkspaceCredits(params.id).then(setCredits).catch(() => setCredits(null));
  }, [connection?.workspaceId, params?.id]);

  async function refreshOperationalData() {
    if (!params?.id) {
      return;
    }
    const [franchiseData, connectionData, setupData, channelData, conversationData] = await Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseSetup(params.id),
      getFranchiseChannels(params.id).catch(() => []),
      getConversations({ franchiseId: params.id }).catch(() => [])
    ]);
    setFranchise(franchiseData);
    setConnection(connectionData);
    setSetup(setupData);
    setChannels(channelData);
    setConversations(conversationData);
  }

  async function handleCreateAdminUser() {
    if (!params?.id) {
      return;
    }
    setIsSavingAdmin(true);
    setError(null);
    setSuccess(null);
    try {
      setAdminUser(await createFranchiseAdminUser(params.id, { name: adminName, email: adminEmail, password: adminPassword }));
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setSuccess("Administrador criado com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar administrador.");
    } finally {
      setIsSavingAdmin(false);
    }
  }

  async function handleLinkWorkspace(forceReplace: boolean) {
    if (!params?.id || !selectedWorkspaceId) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await linkFranchiseWorkspace(params.id, {
        workspaceId: selectedWorkspaceId,
        workspaceName: selectedWorkspace?.name,
        confirmCriticalChange: forceReplace
      });
      setSelectedWorkspaceId("");
      setConfirmAction(null);
      await refreshOperationalData();
      setSuccess("Conexão atualizada com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel atualizar conexao.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUnlinkWorkspace() {
    if (!params?.id) {
      return;
    }
    setIsSaving(true);
    try {
      await unlinkFranchiseWorkspace(params.id, { confirmCriticalChange: true });
      setConfirmAction(null);
      await refreshOperationalData();
      setSuccess("Workspace desvinculada com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel desvincular workspace.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClearAgent() {
    if (!params?.id) {
      return;
    }
    setIsSaving(true);
    try {
      await clearFranchiseAgent(params.id, { confirmCriticalChange: true });
      setConfirmAction(null);
      await refreshOperationalData();
      setSuccess("Agente removido com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel remover agente.");
    } finally {
      setIsSaving(false);
    }
  }

  const humanConversations = conversations.filter((item) => item.operationalStatus === "em_atendimento_humano").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Franquia"
        title={franchise?.name ?? "Franquia"}
        description={isSuperAdmin ? "Gerencie todos os aspectos desta unidade." : "Status operacional da sua unidade."}
        backHref="/franquias"
      />

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800 px-5 py-4 text-sm text-rose-700 dark:text-rose-300 animate-in flex items-center gap-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">!</span>
          </div>
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300 animate-in flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-600" />
          <p className="ml-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando franquia...</p>
        </div>
      ) : (
        <div className="grid gap-6 stagger-children">
          {/* Summary Cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              icon={Building2}
              title="Dados"
              value={`${franchise?.city} / ${franchise?.state}`}
              subtitle={franchise?.document ?? undefined}
              action={{ label: "Editar", href: `/franquias/${franchise?.id}` }}
            />
            <InfoCard
              icon={UserRound}
              title="Administrador"
              value={adminUser?.name ?? "Não cadastrado"}
              subtitle={adminUser?.email ?? undefined}
              variant={adminUser ? "success" : "warning"}
            />
            <InfoCard
              icon={PlugZap}
              title="Conexão GPTMaker"
              value={connection?.workspaceName ?? "Não vinculada"}
              variant={connection?.workspaceId ? "success" : "warning"}
            />
            <InfoCard
              icon={Bot}
              title="Agente"
              value={connection?.agentName ?? "Não configurado"}
              action={connection?.agentId ? { label: "Abrir", href: `/franquias/${franchise?.id}/agente` } : undefined}
              variant={connection?.agentId ? "success" : "warning"}
            />
            {connection?.workspaceId && credits && (
              <article className="card group border-line/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-200 group-hover:scale-110">
                    <Zap size={20} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                    {credits.credits > 0 ? Math.round((credits.remaining / credits.credits) * 100) : 0}%
                  </span>
                </div>
                <h3 className="mt-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>Créditos workspace</h3>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {credits.remaining.toLocaleString()} / {credits.credits.toLocaleString()}
                </p>
                <div className="mt-3 h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--color-bg-tertiary, #e2e8f0)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${credits.credits > 0 ? Math.round((credits.remaining / credits.credits) * 100) : 0}%`,
                      background: credits.remaining / credits.credits > 0.2
                        ? "var(--color-brand-500, #6366f1)"
                        : credits.remaining / credits.credits > 0.05
                          ? "#f59e0b"
                          : "#ef4444"
                    }}
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  {credits.used.toLocaleString()} utilizados
                </p>
              </article>
            )}
          </section>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <StatusBadge status={franchise?.status ?? "PENDENTE_CONFIGURACAO"} size="md" />
          </div>

          {/* Main Content Grid */}
          <section className="grid gap-6 xl:grid-cols-2">
            {/* Training & Setup */}
            <div className="card">
              <SectionHeader
                title="Treinamento e setup"
                description="Progresso da configuração do agente."
                icon={<Settings size={20} />}
              />
              <div className="grid gap-3">
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Status</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{setup?.setupStatus.replaceAll("_", " ")}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-500"
                          style={{ width: `${setup?.completionPercentage ?? 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-brand-600">{setup?.completionPercentage ?? 0}%</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Última publicação</p>
                  <p className="mt-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {setup?.lastPublishedAt
                      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(setup.lastPublishedAt))
                      : "Nunca publicada"}
                  </p>
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Exemplos ativos</p>
                  <p className="mt-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>{setup?.examples?.filter((item) => item.includeInTraining).length ?? 0}</p>
                </div>
              </div>
              <div className="mt-5">
                <Link href="/setup-guiado" className="btn-primary">
                  <Zap size={16} />
                  Abrir workbench
                </Link>
              </div>
            </div>

            {/* Channels & Conversations */}
            <div className="card">
              <SectionHeader
                title="Canais e conversas"
                description="Status dos canais e atendimentos."
                icon={<Radio size={20} />}
              />
              <div className="grid gap-3">
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Canais sincronizados</p>
                      <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{channels.length}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Radio size={22} />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Conversas humanas</p>
                      <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{humanConversations}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                      <MessageCircle size={22} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/canais" className="btn-secondary">
                  <Radio size={16} />
                  Abrir canais
                </Link>
                <Link href="/conversas" className="btn-primary">
                  <MessageCircle size={16} />
                  Abrir inbox
                </Link>
              </div>
            </div>
          </section>

          {/* Admin & Connection */}
          <section className="grid gap-6 xl:grid-cols-2">
            {/* Administrator */}
            <div className="card">
              <SectionHeader
                title="Administrador"
                description="Usuário que gerencia esta franquia."
                icon={<UserRound size={20} />}
              />
              {adminUser ? (
                <div className="rounded-xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Nome</span>
                      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{adminUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Email</span>
                      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{adminUser.email}</span>
                    </div>
                  </div>
                </div>
              ) : isSuperAdmin ? (
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="input-field"
                      placeholder="Nome do administrador"
                      value={adminName}
                      onChange={(event) => setAdminName(event.target.value)}
                    />
                    <input
                      className="input-field"
                      placeholder="Email"
                      value={adminEmail}
                      onChange={(event) => setAdminEmail(event.target.value)}
                    />
                    <input
                      type="password"
                      className="input-field sm:col-span-2"
                      placeholder="Senha inicial"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCreateAdminUser()}
                    disabled={isSavingAdmin}
                    className="btn-primary w-fit"
                  >
                    {isSavingAdmin ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Criar administrador
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <EmptyState
                  icon={UserRound}
                  title="Administrador pendente"
                  description="A matriz ainda não criou o acesso administrativo desta franquia."
                />
              )}
            </div>

            {/* GPTMaker Connection */}
            {isSuperAdmin && (
              <div className="card">
                <SectionHeader
                  title="Conexão GPTMaker"
                  description="Workspace e agente vinculados."
                  icon={<PlugZap size={20} />}
                />
                <div className="grid gap-4">
                  <select
                    className="input-field"
                    value={selectedWorkspaceId}
                    onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                  >
                    <option value="">Selecione uma workspace</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => connection?.workspaceId ? setConfirmAction("replace-workspace") : void handleLinkWorkspace(false)}
                      disabled={!selectedWorkspaceId || isSaving}
                      className="btn-primary"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                      {connection?.workspaceId ? "Trocar workspace" : "Vincular workspace"}
                    </button>
                    {connection?.workspaceId && (
                      <button
                        type="button"
                        onClick={() => setConfirmAction("unlink-workspace")}
                        className="btn-secondary"
                      >
                        <Unlink size={16} />
                        Desvincular
                      </button>
                    )}
                    {connection?.agentId && (
                      <button
                        type="button"
                        onClick={() => setConfirmAction("clear-agent")}
                        className="btn-secondary text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 size={16} />
                        Remover agente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmAction !== null}
        isSubmitting={isSaving}
        title="Confirmar alteração"
        description="Esta ação altera a operação da franquia. Confirme para continuar."
        confirmLabel="Confirmar"
        variant={confirmAction === "clear-agent" ? "danger" : "default"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "replace-workspace") {
            void handleLinkWorkspace(true);
            return;
          }
          if (confirmAction === "unlink-workspace") {
            void handleUnlinkWorkspace();
            return;
          }
          void handleClearAgent();
        }}
      />
    </AppShell>
  );
}
