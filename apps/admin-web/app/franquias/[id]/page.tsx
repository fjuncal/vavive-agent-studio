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
  getFranchiseAdminUser,
  getFranchiseById,
  getFranchiseGptMakerConnection,
  linkFranchiseWorkspace,
  unlinkFranchiseWorkspace,
  type FranchiseAdminUser,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerWorkspaceOption
} from "@/lib/api";
import { Bot, Building2, Loader2, PlugZap, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function FranchiseDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [adminUser, setAdminUser] = useState<FranchiseAdminUser | null>(null);
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
  const [confirmAction, setConfirmAction] = useState<null | "replace-workspace" | "unlink-workspace" | "clear-agent">(null);

  const selectedWorkspace = useMemo(
    () => workspaces.find((item) => item.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces]
  );

  const hasWorkspace = !!franchise?.workspaceId;

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseAdminUser(params.id).catch(() => null)
    ])
      .then(([franchiseData, connectionData, adminData]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setAdminUser(adminData);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar a franquia.");
      })
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }
    getAvailableGptMakerWorkspaces()
      .then(setWorkspaces)
      .catch(() => setWorkspaces([]));
  }, [isSuperAdmin]);

  async function handleCreateAdminUser() {
    if (!params?.id) {
      return;
    }
    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setError("Preencha nome, email e senha.");
      setSuccess(null);
      return;
    }

    setIsSavingAdmin(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createFranchiseAdminUser(params.id, {
        name: adminName,
        email: adminEmail,
        password: adminPassword
      });
      setAdminUser(created);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setSuccess("Administrador criado.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível criar o administrador.");
    } finally {
      setIsSavingAdmin(false);
    }
  }

  async function handleLinkWorkspace(forceReplace: boolean) {
    if (!params?.id || !selectedWorkspaceId) {
      setError("Selecione uma integração disponível.");
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await linkFranchiseWorkspace(params.id, {
        workspaceId: selectedWorkspaceId,
        workspaceName: selectedWorkspace?.name,
        confirmCriticalChange: forceReplace
      });
      setConnection(response);
      setFranchise((current) => current ? {
        ...current,
        status: response.status,
        workspaceId: response.workspaceId,
        workspaceName: response.workspaceName,
        agentId: response.agentId,
        agentName: response.agentName,
        gptMakerLastSyncAt: response.lastSyncAt
      } : current);
      setSelectedWorkspaceId("");
      setConfirmAction(null);
      setSuccess("Integração vinculada.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível vincular.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUnlinkWorkspace() {
    if (!params?.id) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await unlinkFranchiseWorkspace(params.id, { confirmCriticalChange: true });
      setConnection(response);
      setFranchise((current) => current ? {
        ...current,
        status: response.status,
        workspaceId: null,
        workspaceName: null,
        agentId: null,
        agentName: null,
        gptMakerLastSyncAt: null
      } : current);
      setConfirmAction(null);
      setSuccess("Integração desvinculada.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível desvincular.");
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
      setFranchise((current) => current ? {
        ...current,
        status: response.status,
        agentId: null,
        agentName: null,
        gptMakerLastSyncAt: null
      } : current);
      setConfirmAction(null);
      setSuccess("Agente removido.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível remover o agente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Franquia"
        title={franchise?.name ?? "Carregando"}
        description={isSuperAdmin ? "Gerencie a unidade, acesso e agente." : "Acompanhe sua franquia."}
      />

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      {isLoading ? (
        <section className="rounded-2xl border border-line/80 bg-white/86 p-6 shadow-soft">
          <p className="text-sm text-slate-500">Carregando...</p>
        </section>
      ) : (
        <div className="grid gap-5">
          {/* overview cards */}
          <section className="grid gap-4 xl:grid-cols-4">
            <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <Building2 size={20} className="text-brand-700" />
              <h2 className="mt-4 font-semibold text-ink">Dados da franquia</h2>
              <p className="mt-1 text-sm text-slate-500">{franchise?.city} / {franchise?.state}</p>
              {franchise?.document ? <p className="text-sm text-slate-500">{franchise.document}</p> : null}
              <div className="mt-3"><StatusBadge status={franchise?.status ?? "PENDENTE_CONFIGURACAO"} /></div>
            </article>
            <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <UserRound size={20} className="text-brand-700" />
              <h2 className="mt-4 font-semibold text-ink">Administrador</h2>
              <p className="mt-2 text-sm text-slate-500">{adminUser?.name ?? "Não cadastrado"}</p>
              {adminUser ? <p className="text-sm text-slate-500">{adminUser.email}</p> : null}
            </article>
            {isSuperAdmin ? (
              <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
                <PlugZap size={20} className="text-brand-700" />
                <h2 className="mt-4 font-semibold text-ink">Integração</h2>
                <p className="mt-2 text-sm text-slate-500">{connection?.workspaceName ?? "Não vinculada"}</p>
              </article>
            ) : null}
            <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <Bot size={20} className="text-brand-700" />
              <h2 className="mt-4 font-semibold text-ink">Agente da franquia</h2>
              <p className="mt-2 text-sm text-slate-500">{connection?.agentName ?? "Não configurado"}</p>
              {connection?.agentId ? (
                <Link href={`/franquias/${franchise?.id}/agente`} className="mt-3 inline-flex rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                  Abrir agente
                </Link>
              ) : null}
            </article>
          </section>

          {/* admin user detail */}
          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Administrador</h2>
            {adminUser ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p><strong className="text-ink">Nome:</strong> {adminUser.name}</p>
                <p className="mt-1"><strong className="text-ink">Email:</strong> {adminUser.email}</p>
              </div>
            ) : isSuperAdmin ? (
              <div className="mt-4 grid gap-4">
                <p className="text-sm text-slate-500">Cadastre o responsável pela franquia.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Nome</span>
                    <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={adminName} onChange={(event) => setAdminName(event.target.value)} />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Email</span>
                    <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} />
                  </label>
                  <label className="grid gap-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Senha inicial</span>
                    <input type="password" className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} />
                  </label>
                  <button type="button" onClick={() => void handleCreateAdminUser()} disabled={isSavingAdmin} className="w-fit rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                    {isSavingAdmin ? "Salvando..." : "Criar administrador"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Aguardando cadastro pela administração.</p>
            )}
          </section>

          {/* agent section - always visible */}
          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Agente da franquia</h2>
            <p className="mt-1 text-sm text-slate-500">Configuração do agente de atendimento.</p>

            {!hasWorkspace ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-medium">Nenhuma integração vinculada</p>
                  <p className="mt-1">Para criar o agente, primeiro vincule uma integração.</p>
                </div>
                <button type="button" disabled className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-400 cursor-not-allowed">
                  Criar agente
                </button>
                <p className="text-xs text-slate-400">Disponível após vincular integração.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p><strong className="text-ink">Agente:</strong> {connection?.agentName ?? "Não configurado"}</p>
                  {connection?.workspaceName ? (
                    <p className="mt-1"><strong className="text-ink">Integração:</strong> {connection.workspaceName}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/franquias/${franchise?.id}/agente`} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">
                    {connection?.agentId ? "Abrir agente" : "Configurar agente"}
                  </Link>
                  {connection?.agentId ? (
                    <button type="button" onClick={() => setConfirmAction("clear-agent")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line">
                      Remover agente
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </section>

          {/* connection section - SUPER_ADMIN only */}
          {isSuperAdmin ? (
            <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Conexão</h2>
              <p className="mt-1 text-sm text-slate-500">Gerencie a integração da franquia.</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <p className="rounded-xl bg-slate-50 p-3">Integração atual: <strong className="text-ink">{connection?.workspaceName ?? "Nenhuma"}</strong></p>
              </div>
              <div className="mt-4 grid gap-3">
                <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={selectedWorkspaceId} onChange={(event) => setSelectedWorkspaceId(event.target.value)}>
                  <option value="">Selecione uma integração</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => connection?.workspaceId ? setConfirmAction("replace-workspace") : void handleLinkWorkspace(false)} disabled={!selectedWorkspaceId || isSaving} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                    {connection?.workspaceId ? "Trocar" : "Vincular"}
                  </button>
                  {connection?.workspaceId ? (
                    <button type="button" onClick={() => setConfirmAction("unlink-workspace")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line">
                      Desvincular
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
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
