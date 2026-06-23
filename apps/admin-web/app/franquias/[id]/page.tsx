"use client";

import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { formatCreditsStatus, getCreditsNumbers, getCreditsPercentage } from "@/lib/credits";
import {
  clearFranchiseAgent,
  createFranchiseAdminUser,
  getAvailableGptMakerWorkspaces,
  getConversations,
  getFranchiseAdminUser,
  getFranchiseById,
  getFranchiseChannels,
  getFranchiseGptMakerConnection,
  getFranchiseSetup,
  getWorkspaceCredits,
  linkFranchiseWorkspace,
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
import { ArrowRight, Bot, Building2, Coins, Loader2, MessageCircle, PlugZap, Radio, Settings, Trash2, Unlink, UserRound } from "lucide-react";
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
  const [adminUser, setAdminUser] = useState<FranchiseAdminUser | null>(null);
  const [channels, setChannels] = useState<FranchiseChannel[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [workspaces, setWorkspaces] = useState<GptMakerWorkspaceOption[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [credits, setCredits] = useState<WorkspaceCredits | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
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
      getConversations({ franchiseId: params.id }).catch(() => []),
      getWorkspaceCredits(params.id).catch(() => null)
    ])
      .then(([franchiseData, connectionData, setupData, adminData, channelData, conversationData, creditData]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setSetup(setupData);
        setAdminUser(adminData);
        setChannels(channelData);
        setConversations(conversationData);
        setCredits(creditData);
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
      setSuccess("Workspace atualizada com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel atualizar workspace.");
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
            <InfoCard icon={PlugZap} title="Workspace" value={connection?.workspaceName ?? "Nao vinculada"} />
            <InfoCard icon={Bot} title="Assistente" value={connection?.agentName ?? "Nao configurado"} action={connection?.agentId ? { label: "Abrir", href: `/franquias/${franchise?.id}/agente` } : undefined} />
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

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="card">
              <div className="flex items-start gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Assistente Vavive</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Progresso do setup e publicacoes.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>Status</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{setup?.setupStatus?.replaceAll("_", " ") ?? "Nao iniciado"}</p>
                    <span className="text-sm font-medium text-brand-600">{setup?.completionPercentage ?? 0}%</span>
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
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Administrador</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Usuario responsavel pela unidade.</p>
              {adminUser ? (
                <div className="mt-4 rounded-xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{adminUser.name}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{adminUser.email}</p>
                </div>
              ) : isSuperAdmin ? (
                <div className="mt-4 grid gap-3">
                  <input className="input-field" placeholder="Nome do administrador" value={adminName} onChange={(event) => setAdminName(event.target.value)} />
                  <input className="input-field" placeholder="Email do administrador" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} />
                  <input className="input-field" placeholder="Senha temporaria" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} />
                  <button type="button" onClick={() => void handleCreateAdminUser()} disabled={isSavingAdmin} className="btn-primary">
                    {isSavingAdmin ? "Salvando..." : "Criar administrador"}
                  </button>
                </div>
              ) : null}
            </div>

            {isSuperAdmin ? (
              <div className="card">
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Workspace da unidade</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Area tecnica da matriz para vinculo de workspace.</p>
                <div className="mt-4 grid gap-3">
                  <select className="input-field" value={selectedWorkspaceId} onChange={(event) => setSelectedWorkspaceId(event.target.value)}>
                    <option value="">Selecione um workspace</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" disabled={!selectedWorkspaceId || isSaving} onClick={() => void handleLinkWorkspace(false)} className="btn-primary">
                      Vincular workspace
                    </button>
                    {connection?.workspaceId ? (
                      <button type="button" disabled={isSaving} onClick={() => setConfirmAction("unlink-workspace")} className="btn-secondary">
                        <Unlink size={16} />
                        Desvincular
                      </button>
                    ) : null}
                    {connection?.agentId ? (
                      <button type="button" disabled={isSaving} onClick={() => setConfirmAction("clear-agent")} className="btn-secondary">
                        <Trash2 size={16} />
                        Limpar assistente
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
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
    </AppShell>
  );
}
