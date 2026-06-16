"use client";

import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { Bot, Building2, Link2, Loader2, PlugZap, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Ainda nao sincronizado";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

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
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar a franquia.");
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
      setError("Preencha nome, email e senha inicial do administrador.");
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
      setSuccess("Administrador criado com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar o administrador.");
    } finally {
      setIsSavingAdmin(false);
    }
  }

  async function handleLinkWorkspace(forceReplace: boolean) {
    if (!params?.id || !selectedWorkspaceId) {
      setError("Selecione uma workspace disponivel.");
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
      setSuccess("Workspace vinculada com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel vincular a workspace.");
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
      setSuccess("Workspace desvinculada da franquia.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel desvincular a workspace.");
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
      setSuccess("Agente removido da franquia.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel remover o agente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Franquia"
        title={franchise?.name ?? "Carregando franquia"}
        description={isSuperAdmin ? "Gerencie a unidade, o administrador e a configuracao do agente." : "Acompanhe o status da sua franquia e dos treinamentos liberados."}
      />

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      {isLoading ? (
        <section className="rounded-2xl border border-line/80 bg-white/86 p-6 shadow-soft">
          <p className="text-sm text-slate-500">Carregando dados da franquia...</p>
        </section>
      ) : (
        <div className="grid gap-5">
          <section className="grid gap-4 xl:grid-cols-4">
            <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <Building2 className="text-brand-700" size={20} />
              <h2 className="mt-4 font-semibold text-ink">Dados da franquia</h2>
              <p className="mt-2 text-sm text-slate-500">{franchise?.city} / {franchise?.state}</p>
              <div className="mt-4"><StatusBadge status={franchise?.status ?? "PENDENTE_CONFIGURACAO"} /></div>
            </article>
            <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <UserRound className="text-brand-700" size={20} />
              <h2 className="mt-4 font-semibold text-ink">Administrador</h2>
              <p className="mt-2 text-sm text-slate-500">{adminUser?.email ?? "Ainda nao cadastrado"}</p>
            </article>
            <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <PlugZap className="text-brand-700" size={20} />
              <h2 className="mt-4 font-semibold text-ink">{isSuperAdmin ? "Workspace GPTMaker" : "Status da franquia"}</h2>
              <p className="mt-2 text-sm text-slate-500">{isSuperAdmin ? (connection?.workspaceName ?? "Nao vinculada") : franchise?.status?.replaceAll("_", " ")}</p>
            </article>
            <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <Bot className="text-brand-700" size={20} />
              <h2 className="mt-4 font-semibold text-ink">Agente da franquia</h2>
              <p className="mt-2 text-sm text-slate-500">{connection?.agentName ?? "Configuracao pendente"}</p>
            </article>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Dados da franquia</h2>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <p><strong className="text-ink">Nome:</strong> {franchise?.name ?? "-"}</p>
                <p><strong className="text-ink">Documento:</strong> {franchise?.document ?? "-"}</p>
                <p><strong className="text-ink">Cidade:</strong> {franchise?.city ?? "-"}</p>
                <p><strong className="text-ink">Estado:</strong> {franchise?.state ?? "-"}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Administrador</h2>
              {adminUser ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p><strong className="text-ink">Nome:</strong> {adminUser.name}</p>
                  <p className="mt-1"><strong className="text-ink">Email:</strong> {adminUser.email}</p>
                </div>
              ) : isSuperAdmin ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              ) : (
                <p className="mt-4 text-sm text-slate-500">Administrador ainda nao cadastrado.</p>
              )}
            </section>
          </section>

          {isSuperAdmin ? (
            <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Workspace GPTMaker</h2>
                <p className="mt-2 text-sm text-slate-500">Gerencie a conexao da franquia com uma unica workspace existente.</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <p className="rounded-xl bg-slate-50 p-4">Workspace atual: <strong className="text-ink">{connection?.workspaceName ?? "Nao vinculada"}</strong></p>
                  <p className="rounded-xl bg-slate-50 p-4">Ultima sincronizacao: <strong className="text-ink">{formatDateTime(connection?.lastSyncAt)}</strong></p>
                </div>
                <div className="mt-4 grid gap-3">
                  <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={selectedWorkspaceId} onChange={(event) => setSelectedWorkspaceId(event.target.value)}>
                    <option value="">Selecione uma workspace disponivel</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => connection?.workspaceId ? setConfirmAction("replace-workspace") : void handleLinkWorkspace(false)} disabled={!selectedWorkspaceId || isSaving} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                      {connection?.workspaceId ? "Trocar workspace" : "Vincular workspace"}
                    </button>
                    {connection?.workspaceId ? (
                      <button type="button" onClick={() => setConfirmAction("unlink-workspace")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line">
                        Desvincular workspace
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Agente da franquia</h2>
                {!connection?.workspaceId ? (
                  <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">Vincule uma workspace antes de configurar o agente.</p>
                ) : (
                  <div className="mt-4 grid gap-4">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p><strong className="text-ink">Agente atual:</strong> {connection?.agentName ?? "Ainda nao configurado"}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/franquias/${franchise?.id}/agente`} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">
                        {connection?.agentId ? "Reconfigurar agente" : "Configurar agente"}
                      </Link>
                      {connection?.agentId ? (
                        <>
                          <button type="button" onClick={() => setConfirmAction("clear-agent")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line">
                            Remover agente
                          </button>
                          <Link href={`/franquias/${franchise?.id}/agente`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line">
                            Treinamentos
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}
              </section>
            </section>
          ) : (
            <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Status da franquia</h2>
                {franchise?.status === "PENDENTE_CONFIGURACAO" ? (
                  <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">Franquia ainda nao ativa. A matriz precisa finalizar a configuracao.</p>
                ) : (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p>Status atual: <strong className="text-ink">{franchise?.status?.replaceAll("_", " ")}</strong></p>
                    <p className="mt-1">Ultima sincronizacao: <strong className="text-ink">{formatDateTime(connection?.lastSyncAt)}</strong></p>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-ink">Meu agente</h2>
                {connection?.agentId ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <p className="w-full rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Agente configurado: <strong className="text-ink">{connection.agentName}</strong></p>
                    <Link href={`/franquias/${franchise?.id}/agente`} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">Abrir meu agente</Link>
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Seu agente ainda nao foi configurado pela matriz.</p>
                )}
              </section>
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmAction !== null}
        isSubmitting={isSaving}
        title="Confirmar alteracao critica"
        description="Essa acao pode desconectar a franquia do agente GPTMaker e afetar o atendimento. Confirme para continuar."
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
