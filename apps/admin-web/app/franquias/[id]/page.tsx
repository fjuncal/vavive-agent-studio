"use client";

import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DeactivateFranchiseDialog } from "@/components/DeactivateFranchiseDialog";
import { EditAdminEmailDialog } from "@/components/EditAdminEmailDialog";
import { PageHeader } from "@/components/PageHeader";
import { ResetAdminPasswordDialog } from "@/components/ResetAdminPasswordDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { formatCreditsStatus, getCreditsNumbers, getCreditsPercentage } from "@/lib/credits";
import {
  clearFranchiseAgent,
  createFranchiseAdminUser,
  getAvailableGptMakerWorkspaces,
  getConversations,
  getFranchiseAdminUsers,
  getFranchiseById,
  getFranchiseChannels,
  getFranchiseGptMakerConnection,
  getFranchiseSetup,
  getWorkspaceCredits,
  linkFranchiseWorkspace,
  resetFranchiseAdminPassword,
  updateFranchiseAccessStatus,
  updateFranchiseAdminEmail,
  unlinkFranchiseWorkspace,
  type ConversationSummary,
  type FranchiseAdminUser,
  type FranchiseChannel,
  type FranchiseGptMakerConnection,
  type FranchiseSetup,
  type FranchiseSummary,
  type GptMakerWorkspaceOption,
  type WorkspaceCredits
} from "@/lib/api";
import { ArrowRight, Bot, Building2, CheckCircle2, Coins, KeyRound, Loader2, Mail, MessageCircleMore, PlugZap, Radio, Settings, ShieldCheck, ShieldOff, Trash2, Unlink, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function InfoCard({
  title,
  value,
  subtitle,
  icon: Icon,
  action
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof Building2;
  action?: { label: string; href: string };
}) {
  return (
    <article className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon size={20} />
        </div>
        {action ? (
          <Link href={action.href} className="flex items-center gap-1 text-xs font-medium text-brand-600">
            {action.label}
            <ArrowRight size={12} />
          </Link>
        ) : null}
      </div>
      <h3 className="mt-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{value}</p>
      {subtitle ? <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>{subtitle}</p> : null}
    </article>
  );
}

export default function FranchiseDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [setup, setSetup] = useState<FranchiseSetup | null>(null);
  const [adminUsers, setAdminUsers] = useState<FranchiseAdminUser[]>([]);
  const [channels, setChannels] = useState<FranchiseChannel[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [workspaces, setWorkspaces] = useState<GptMakerWorkspaceOption[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [credits, setCredits] = useState<WorkspaceCredits | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [editingAdminUser, setEditingAdminUser] = useState<FranchiseAdminUser | null>(null);
  const [resettingAdminUser, setResettingAdminUser] = useState<FranchiseAdminUser | null>(null);
  const [isSavingAdminEmail, setIsSavingAdminEmail] = useState(false);
  const [isResettingAdminPassword, setIsResettingAdminPassword] = useState(false);
  const [isSavingAccessStatus, setIsSavingAccessStatus] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [workspaceLoadError, setWorkspaceLoadError] = useState<string | null>(null);
  const [accessStatusAction, setAccessStatusAction] = useState<"deactivate" | "reactivate" | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | "replace-workspace" | "unlink-workspace" | "clear-agent">(null);

  const adminUser = adminUsers[0] ?? (user?.role === "ADMIN_FRANQUIA" ? user : null);

  const selectedWorkspace = useMemo(
    () => workspaces.find((item) => item.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces]
  );

  useEffect(() => {
    if (!params?.id) {
      return;
    }
    setIsLoading(true);
    setSelectedWorkspaceId("");
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseSetup(params.id),
      isSuperAdmin ? getFranchiseAdminUsers(params.id).catch(() => []) : Promise.resolve<FranchiseAdminUser[]>([]),
      getFranchiseChannels(params.id).catch(() => []),
      getConversations({ franchiseId: params.id }).catch(() => []),
      getWorkspaceCredits(params.id).catch(() => null)
    ])
      .then(([franchiseData, connectionData, setupData, adminData, channelData, conversationData, creditData]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setSetup(setupData);
        setAdminUsers(adminData);
        setChannels(channelData);
        setConversations(conversationData);
        setCredits(creditData);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar a franquia.");
      })
      .finally(() => setIsLoading(false));
  }, [isSuperAdmin, params?.id]);

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }
    let cancelled = false;
    setIsLoadingWorkspaces(true);
    setWorkspaceLoadError(null);
    getAvailableGptMakerWorkspaces()
      .then((workspaceData) => {
        if (!cancelled) {
          setWorkspaces(workspaceData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkspaces([]);
          setWorkspaceLoadError("Não foi possível carregar os workspaces disponíveis agora.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingWorkspaces(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  async function refreshOperationalData() {
    if (!params?.id) {
      return;
    }
    const [franchiseData, connectionData, setupData, channelData, conversationData, creditData] = await Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseSetup(params.id),
      getFranchiseChannels(params.id).catch(() => []),
      getConversations({ franchiseId: params.id }).catch(() => []),
      getWorkspaceCredits(params.id).catch(() => null)
    ]);
    setFranchise(franchiseData);
    setConnection(connectionData);
    setSetup(setupData);
    setChannels(channelData);
    setConversations(conversationData);
    setCredits(creditData);
  }

  async function handleCreateAdminUser() {
    if (!params?.id) {
      return;
    }
    setIsSavingAdmin(true);
    setError(null);
    setSuccess(null);
    try {
      const createdUser = await createFranchiseAdminUser(params.id, { name: adminName, email: adminEmail, password: adminPassword });
      setAdminUsers((current) => [...current, createdUser]);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setIsCreatingAdmin(false);
      setSuccess("Administrador criado com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar administrador.");
    } finally {
      setIsSavingAdmin(false);
    }
  }

  async function handleUpdateAdminEmail(email: string) {
    if (!params?.id || !editingAdminUser) {
      return;
    }
    setIsSavingAdminEmail(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedUser = await updateFranchiseAdminEmail(params.id, editingAdminUser.id, { email });
      setAdminUsers((current) => current.map((item) => item.id === updatedUser.id ? updatedUser : item));
      setEditingAdminUser(null);
      setSuccess("E-mail atualizado com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel atualizar o e-mail.");
    } finally {
      setIsSavingAdminEmail(false);
    }
  }

  async function handleResetAdminPassword(newPassword: string, confirmPassword: string) {
    if (!params?.id || !resettingAdminUser) {
      return;
    }
    setIsResettingAdminPassword(true);
    setError(null);
    setSuccess(null);
    try {
      await resetFranchiseAdminPassword(params.id, resettingAdminUser.id, { newPassword, confirmPassword });
      setResettingAdminUser(null);
      setSuccess("Senha redefinida com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel redefinir a senha.");
    } finally {
      setIsResettingAdminPassword(false);
    }
  }

  async function handleAccessStatusChange(nextStatus: "ACTIVE" | "INACTIVE") {
    if (!params?.id || !franchise) {
      return;
    }
    setIsSavingAccessStatus(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedFranchise = await updateFranchiseAccessStatus(params.id, nextStatus);
      setFranchise(updatedFranchise);
      setAccessStatusAction(null);
      setSuccess(nextStatus === "INACTIVE" ? "Franquia desativada com sucesso." : "Franquia reativada com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel alterar o status da franquia.");
    } finally {
      setIsSavingAccessStatus(false);
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
      setSuccess("Workspace atualizada com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel atualizar workspace.");
    } finally {
      setIsSaving(false);
    }
  }

  function requestWorkspaceLink() {
    if (!selectedWorkspaceId || isSaving) {
      return;
    }
    if (linkedWorkspaceId) {
      setConfirmAction("replace-workspace");
      return;
    }
    void handleLinkWorkspace(false);
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
      setSuccess("Assistente removido com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel remover assistente.");
    } finally {
      setIsSaving(false);
    }
  }

  const creditNumbers = getCreditsNumbers(credits);
  const creditPercentage = getCreditsPercentage(credits);
  const humanConversations = conversations.filter((item) => item.operationalStatus === "em_atendimento_humano").length;
  const accessStatus = franchise?.accessStatus ?? "ACTIVE";
  const linkedWorkspaceId = connection?.workspaceId ?? franchise?.workspaceId ?? null;
  const linkedWorkspaceName = connection?.workspaceName?.trim() || franchise?.workspaceName?.trim() || null;
  const linkedAgentId = connection?.agentId ?? franchise?.agentId ?? null;
  const linkedAgentName = connection?.agentName?.trim() || franchise?.agentName?.trim() || null;
  const linkedWorkspaceLabel = linkedWorkspaceName ?? (linkedWorkspaceId ? "Workspace vinculado" : null);
  const linkedAgentLabel = linkedAgentName ?? (linkedAgentId ? "Assistente vinculado" : null);
  const availableWorkspaceOptions = workspaces.filter((workspace) => workspace.id !== linkedWorkspaceId);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Franquia"
        title={franchise?.name ?? "Franquia"}
        description={isSuperAdmin ? "Gestao operacional da unidade." : "Resumo operacional da sua unidade."}
        backHref="/franquias"
      />

      {error ? <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800 px-5 py-4 text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}
      {success ? <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300">{success}</div> : null}

      {isLoading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-600" />
          <p className="ml-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando franquia...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={Building2} title="Dados" value={`${franchise?.city} / ${franchise?.state}`} subtitle={franchise?.document ?? undefined} />
            <InfoCard icon={UserRound} title="Administrador" value={adminUser?.name ?? "Nao cadastrado"} subtitle={adminUser?.email ?? undefined} />
            <InfoCard icon={PlugZap} title="Workspace" value={linkedWorkspaceLabel ?? "Não vinculado"} subtitle={linkedWorkspaceId ? "Conectado à unidade" : "Nenhum workspace conectado"} />
            <InfoCard icon={Bot} title="Assistente" value={linkedAgentLabel ?? "Não configurado"} action={linkedAgentId ? { label: "Abrir", href: `/franquias/${franchise?.id}/agente` } : undefined} />
            {isSuperAdmin ? (
              <InfoCard
                icon={MessageCircleMore}
                title="Notificações de agendamento"
                value="Contatos e teste do Evolution por franquia"
                action={{ label: "Configurar", href: `/franquias/${franchise?.id}/notificacoes-whatsapp` }}
              />
            ) : null}
          </section>

          <section className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Saldo operacional</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Estado {formatCreditsStatus(credits?.status)} da unidade.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Coins size={22} />
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="rounded-2xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Disponiveis</p>
                <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{creditNumbers.remaining.toLocaleString()}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {creditNumbers.total.toLocaleString()} totais
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Uso da unidade</span>
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{creditPercentage}% restante</span>
                </div>
                <div className="mt-3 h-3 rounded-full overflow-hidden" style={{ background: "var(--color-bg-secondary)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${creditPercentage}%`,
                      background: creditPercentage > 20 ? "var(--color-brand-500, #6366f1)" : creditPercentage > 5 ? "#f59e0b" : "#ef4444"
                    }}
                  />
                </div>
                <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {creditNumbers.used.toLocaleString()} usados. {credits?.message ?? "Saldo indisponivel no momento."}
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <StatusBadge status={franchise?.status ?? "PENDENTE_CONFIGURACAO"} size="md" />
          </div>

          <section className="card border-l-4 border-l-brand-500">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accessStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                  {accessStatus === "ACTIVE" ? <ShieldCheck size={21} /> : <ShieldOff size={21} />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>STATUS DA FRANQUIA</h2>
                  <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Controla o acesso dos usuários da unidade. Não altera dados, workspace ou assistente.
                  </p>
                </div>
              </div>
              <StatusBadge status={accessStatus} size="md" />
            </div>
            {isSuperAdmin ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {accessStatus === "ACTIVE" ? "Os usuários vinculados podem acessar a plataforma." : "Os usuários vinculados estão sem acesso até a reativação."}
                </p>
                {accessStatus === "ACTIVE" ? (
                  <button type="button" className="btn-secondary border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => setAccessStatusAction("deactivate")} disabled={isSavingAccessStatus}>
                    <ShieldOff size={16} />
                    Desativar franquia
                  </button>
                ) : (
                  <button type="button" className="btn-primary" onClick={() => setAccessStatusAction("reactivate")} disabled={isSavingAccessStatus}>
                    <ShieldCheck size={16} />
                    Reativar franquia
                  </button>
                )}
              </div>
            ) : null}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="card">
              <div className="flex items-start gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Assistente Vavive</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Status e publicações do assistente.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Status</p>
                  <div className="mt-2 flex items-center gap-3">
                    <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{setup?.setupStatus?.replaceAll("_", " ") ?? "Nao iniciado"}</p>
                  </div>
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Ultima publicacao</p>
                  <p className="mt-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {setup?.lastPublishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(setup.lastPublishedAt)) : "Nunca publicada"}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/franquias/${franchise?.id}/agente${connection?.agentId ? "" : "/novo"}`} className="btn-primary">
                  {connection?.agentId ? "Revisar assistente" : "Criar assistente"}
                </Link>
                {connection?.agentId ? (
                  <Link href={`/franquias/${franchise?.id}/agente/configuracao`} className="btn-secondary">Configurar assistente</Link>
                ) : null}
              </div>
            </div>

            <div className="card">
              <div className="flex items-start gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Radio size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Canais e atendimento</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Status dos canais e atendimentos da unidade.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Canais sincronizados</p>
                  <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{channels.length}</p>
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Conversas humanas</p>
                  <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{humanConversations}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/canais" className="btn-secondary">Abrir canais</Link>
                <Link href="/conversas" className="btn-primary">Abrir inbox</Link>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="card">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{isSuperAdmin ? "ACESSO DOS FRANQUEADOS" : "Administrador"}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{isSuperAdmin ? "Usuários ADMIN_FRANQUIA vinculados a esta unidade." : "Usuário responsável pela unidade."}</p>
              {isSuperAdmin ? (
                <div className="mt-5 grid gap-3">
                  {adminUsers.length ? adminUsers.map((admin) => (
                    <div key={admin.id} className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--color-bg-secondary)" }}>
                      <div className="min-w-0">
                        <p className="truncate font-medium" style={{ color: "var(--color-text-primary)" }}>{admin.name}</p>
                        <p className="mt-1 truncate text-sm" style={{ color: "var(--color-text-secondary)" }}>{admin.email}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setEditingAdminUser(admin)} disabled={isSavingAdminEmail || isResettingAdminPassword}>
                          <Mail size={14} />
                          Editar e-mail
                        </button>
                        <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setResettingAdminUser(admin)} disabled={isSavingAdminEmail || isResettingAdminPassword}>
                          <KeyRound size={14} />
                          Redefinir senha
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Nenhum usuário ADMIN_FRANQUIA cadastrado nesta franquia.
                    </div>
                  )}

                  {(!adminUsers.length || isCreatingAdmin) ? (
                    <div className="grid gap-3 border-t border-border pt-5">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {adminUsers.length ? "Adicionar outro acesso" : "Criar acesso do franqueado"}
                      </p>
                      <input className="input-field" placeholder="Nome do administrador" value={adminName} onChange={(event) => setAdminName(event.target.value)} disabled={isSavingAdmin} />
                      <input className="input-field" placeholder="E-mail do administrador" type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} disabled={isSavingAdmin} />
                      <input className="input-field" placeholder="Senha temporária" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} disabled={isSavingAdmin} />
                      <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>A senha deve ter pelo menos 8 caracteres, uma letra e um número.</p>
                      <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => void handleCreateAdminUser()} disabled={isSavingAdmin} className="btn-primary">
                          {isSavingAdmin ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : "Criar administrador"}
                        </button>
                        {adminUsers.length ? (
                          <button type="button" onClick={() => setIsCreatingAdmin(false)} disabled={isSavingAdmin} className="btn-secondary">Cancelar</button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setIsCreatingAdmin(true)} className="btn-secondary">Adicionar outro acesso</button>
                  )}
                </div>
              ) : adminUser ? (
                <div className="mt-4 rounded-xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{adminUser.name}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{adminUser.email}</p>
                </div>
              ) : null}
            </div>

            {isSuperAdmin ? (
              <section className="card overflow-hidden p-0">
                <div className="border-b border-border px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${linkedWorkspaceId ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                        {linkedWorkspaceId ? <CheckCircle2 size={20} /> : <PlugZap size={20} />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Workspace da unidade</h2>
                          <span className={linkedWorkspaceId ? "badge-success" : "badge-warning"}>{linkedWorkspaceId ? "Vinculado" : "Não vinculado"}</span>
                        </div>
                        <p className="mt-1 max-w-xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          É o workspace usado para manter a conexão da franquia com o GPTMaker.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl px-3 py-2 sm:max-w-[220px] sm:text-right" style={{ background: "var(--color-bg-secondary)" }}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--color-text-tertiary)" }}>Workspace atual</p>
                      <p className="mt-1 truncate text-sm font-semibold" style={{ color: "var(--color-text-primary)" }} title={linkedWorkspaceLabel ?? undefined}>
                        {linkedWorkspaceLabel ?? "Nenhum workspace selecionado"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 px-5 py-5 sm:px-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="rounded-2xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm dark:bg-slate-800">
                        <PlugZap size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--color-text-tertiary)" }}>Conexão preservada</p>
                        <p className="mt-1 truncate font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          {linkedWorkspaceLabel ?? "Ainda não há workspace vinculado"}
                        </p>
                        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          {linkedWorkspaceId ? "Este vínculo continua salvo nesta franquia." : "Escolha um workspace disponível para iniciar o vínculo."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="workspace-selection" className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {linkedWorkspaceId ? "Trocar workspace" : "Vincular workspace"}
                    </label>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {linkedWorkspaceId ? "Selecione outro workspace para substituir o atual." : "Selecione um workspace disponível para esta unidade."}
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
                      <select
                        id="workspace-selection"
                        className="input-field"
                        value={selectedWorkspaceId}
                        onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                        disabled={isLoadingWorkspaces || isSaving}
                      >
                        <option value="">{linkedWorkspaceId ? "Selecione outro workspace" : "Selecione um workspace"}</option>
                        {availableWorkspaceOptions.map((workspace) => (
                          <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                        ))}
                      </select>
                      <button type="button" disabled={!selectedWorkspaceId || isSaving || isLoadingWorkspaces} onClick={requestWorkspaceLink} className="btn-primary shrink-0 sm:min-w-[164px]">
                        {isSaving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : linkedWorkspaceId ? "Trocar workspace" : "Vincular workspace"}
                      </button>
                    </div>
                    {isLoadingWorkspaces ? (
                      <p className="mt-2 flex items-center gap-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                        <Loader2 size={13} className="animate-spin" /> Carregando workspaces disponíveis...
                      </p>
                    ) : workspaceLoadError ? (
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{workspaceLoadError}</p>
                    ) : availableWorkspaceOptions.length === 0 ? (
                      <p className="mt-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                        {linkedWorkspaceId ? "Não há outro workspace disponível para troca no momento." : "Não há workspaces disponíveis no momento."}
                      </p>
                    ) : null}
                  </div>
                </div>

                {linkedWorkspaceId || linkedAgentId ? (
                  <div className="border-t border-border px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Ações avançadas</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>Use somente quando precisar alterar a conexão desta unidade.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {linkedWorkspaceId ? (
                          <button type="button" disabled={isSaving} onClick={() => setConfirmAction("unlink-workspace")} className="btn-secondary px-3 py-2 text-xs">
                            <Unlink size={15} />
                            Desvincular workspace
                          </button>
                        ) : null}
                        {linkedAgentId ? (
                          <button type="button" disabled={isSaving} onClick={() => setConfirmAction("clear-agent")} className="btn-secondary px-3 py-2 text-xs">
                            <Trash2 size={15} />
                            Remover assistente
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </section>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmAction === "unlink-workspace"}
        title="Desvincular workspace"
        description="Esta acao remove workspace e assistente da unidade."
        confirmLabel="Desvincular"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleUnlinkWorkspace()}
      />
      <ConfirmDialog
        isOpen={confirmAction === "clear-agent"}
        title="Limpar assistente"
        description="Esta acao remove o assistente atual da unidade."
        confirmLabel="Remover"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleClearAgent()}
      />
      <ConfirmDialog
        isOpen={confirmAction === "replace-workspace"}
        title="Trocar workspace"
        description="Esta acao substitui o workspace atual e limpa o assistente vinculado."
        confirmLabel="Trocar"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleLinkWorkspace(true)}
      />
      <EditAdminEmailDialog
        user={editingAdminUser}
        isOpen={isSuperAdmin && editingAdminUser !== null}
        isSubmitting={isSavingAdminEmail}
        onCancel={() => setEditingAdminUser(null)}
        onConfirm={(email) => void handleUpdateAdminEmail(email)}
      />
      <ResetAdminPasswordDialog
        user={resettingAdminUser}
        isOpen={isSuperAdmin && resettingAdminUser !== null}
        isSubmitting={isResettingAdminPassword}
        onCancel={() => setResettingAdminUser(null)}
        onConfirm={(newPassword, confirmPassword) => void handleResetAdminPassword(newPassword, confirmPassword)}
      />
      <DeactivateFranchiseDialog
        franchiseName={franchise?.name ?? ""}
        isOpen={isSuperAdmin && accessStatusAction === "deactivate" && franchise !== null}
        isSubmitting={isSavingAccessStatus}
        onCancel={() => setAccessStatusAction(null)}
        onConfirm={() => void handleAccessStatusChange("INACTIVE")}
      />
      <ConfirmDialog
        isOpen={isSuperAdmin && accessStatusAction === "reactivate"}
        title="Reativar franquia?"
        description="Os usuários vinculados voltarão a poder acessar a plataforma. Nenhum dado será recriado ou alterado nessa ação."
        confirmLabel="Reativar"
        isSubmitting={isSavingAccessStatus}
        onCancel={() => setAccessStatusAction(null)}
        onConfirm={() => void handleAccessStatusChange("ACTIVE")}
      />
    </AppShell>
  );
}

