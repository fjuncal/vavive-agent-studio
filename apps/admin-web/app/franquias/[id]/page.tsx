"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import {
  createFranchiseAdminUser,
  getFranchiseAdminUser,
  getFranchiseById,
  getFranchiseDefaultContext,
  getFranchiseGptMakerConnection,
  getGptMakerHealth,
  getGptMakerWorkspaces,
  provisionFranchiseGptMakerAgent,
  type FranchiseAdminUser,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerHealth,
  type GptMakerWorkspaceOption
} from "@/lib/api";
import { Bot, Loader2, PlugZap, RefreshCcw, ShieldCheck, UserRound } from "lucide-react";
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
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [health, setHealth] = useState<GptMakerHealth | null>(null);
  const [adminUser, setAdminUser] = useState<FranchiseAdminUser | null>(null);
  const [workspaces, setWorkspaces] = useState<GptMakerWorkspaceOption[]>([]);
  const [defaultContext, setDefaultContext] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [jobName, setJobName] = useState("Vavive");
  const [jobSite, setJobSite] = useState("https://vavive.com.br");
  const [jobDescription, setJobDescription] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [workspaceLoadError, setWorkspaceLoadError] = useState<string | null>(null);
  const [isProvisionFormOpen, setIsProvisionFormOpen] = useState(false);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isConnected = connection?.status === "CONECTADO";

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
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
      getGptMakerHealth(),
      getFranchiseDefaultContext(params.id).catch(() => null),
      getFranchiseAdminUser(params.id).catch((requestError: unknown) => {
        const status = typeof requestError === "object" && requestError !== null && "status" in requestError ? Number((requestError as { status?: number }).status) : 0;
        if (status === 404) {
          return null;
        }
        throw requestError;
      })
    ])
      .then(([franchiseData, connectionData, healthData, contextData, adminData]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setHealth(healthData);
        setAdminUser(adminData);
        setSelectedWorkspaceId(connectionData.workspaceId ?? "");

        const fallbackAgentName = `Assistente Vavive - ${franchiseData.name}`;
        setAgentName(connectionData.agentName ?? fallbackAgentName);

        const contextText = contextData?.context ?? "";
        setDefaultContext(contextText);
        setJobDescription(contextText);
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

    setIsLoadingWorkspaces(true);
    setWorkspaceLoadError(null);
    getGptMakerWorkspaces()
      .then((items) => {
        setWorkspaces(items);
      })
      .catch((requestError) => {
        const message = requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as workspaces GPTMaker.";
        setWorkspaceLoadError(message);
      })
      .finally(() => setIsLoadingWorkspaces(false));
  }, [isSuperAdmin]);

  async function handleCreateAdminUser() {
    if (!params?.id) {
      return;
    }
    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setError("Preencha nome, email e senha inicial do administrador da franquia.");
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
      setSuccess("Administrador da franquia criado com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar o administrador da franquia.");
    } finally {
      setIsSavingAdmin(false);
    }
  }

  async function handleProvisionAgent() {
    if (!params?.id) {
      return;
    }
    if (!selectedWorkspaceId) {
      setError("Selecione uma workspace GPTMaker existente.");
      setSuccess(null);
      return;
    }
    if (!agentName.trim()) {
      setError("Informe o nome do agente GPTMaker.");
      setSuccess(null);
      return;
    }

    setIsSavingAgent(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await provisionFranchiseGptMakerAgent(params.id, {
        workspaceId: selectedWorkspaceId,
        workspaceName: selectedWorkspace?.name,
        agentName,
        communicationType,
        type: objectiveType,
        jobName,
        jobSite,
        jobDescription
      });
      setConnection(response);
      setSuccess("Agente GPTMaker criado e conectado com sucesso.");
      setIsProvisionFormOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar o agente GPTMaker.");
    } finally {
      setIsSavingAgent(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Franquia"
        title={franchise?.name ?? "Carregando franquia"}
        description={
          franchise
            ? `${franchise.city} / ${franchise.state}. O SUPER_ADMIN cria o admin da franquia, seleciona uma workspace existente e provisiona o agente GPTMaker real.`
            : "Buscando dados da franquia no backend."
        }
      />

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Status da conexao" value={isLoading ? "..." : isConnected ? "Conectado" : "Pendente"} hint="Workspace e agente vinculados por franquia" icon={PlugZap} />
        <StatCard label="Workspace" value={isLoading ? "..." : connection?.workspaceName ?? "Nao conectado"} hint="Workspace GPTMaker da franquia" icon={ShieldCheck} />
        <StatCard label="Agente" value={isLoading ? "..." : connection?.agentName ?? "Nao conectado"} hint="Agente GPTMaker real da franquia" icon={Bot} />
        <StatCard label="Ultima sincronizacao" value={isLoading ? "..." : formatDateTime(connection?.lastSyncAt)} hint="Momento em que o vinculo foi salvo" icon={RefreshCcw} />
      </section>

      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">Proximo passo: conectar GPTMaker</p>
        <p className="mt-2">
          Neste MVP, a workspace precisa existir previamente no GPTMaker. O SUPER_ADMIN seleciona uma workspace e cria o agente da franquia dentro dela.
        </p>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-ink">Administrador da franquia</h2>
                <p className="mt-1 text-sm text-slate-500">O acesso do ADMIN_FRANQUIA fica restrito a esta unidade, seus leads, agentes e configuracoes permitidas.</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              {adminUser ? (
                <>
                  <p><strong className="text-ink">Nome:</strong> {adminUser.name}</p>
                  <p className="mt-1"><strong className="text-ink">Email:</strong> {adminUser.email}</p>
                  <p className="mt-1"><strong className="text-ink">Perfil:</strong> {adminUser.role}</p>
                </>
              ) : (
                <p>Nenhum administrador da franquia cadastrado ainda.</p>
              )}
            </div>

            {isSuperAdmin ? (
              adminUser ? null : (
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
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => void handleCreateAdminUser()}
                      disabled={isSavingAdmin}
                      className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingAdmin ? "Salvando..." : "Criar ADMIN_FRANQUIA"}
                    </button>
                  </div>
                </div>
              )
            ) : null}
          </section>

          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-semibold text-ink">Conectar GPTMaker</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  A franquia precisa usar uma workspace GPTMaker ja existente. O SUPER_ADMIN cria o agente real dentro dela e o sistema salva o vinculo.
                </p>
              </div>
              <StatusBadge status={connection?.status ?? "NAO_CONECTADO"} />
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p><strong className="text-ink">Workspace conectada:</strong> {connection?.workspaceName ?? "Nao conectada"}</p>
                <p className="mt-1 text-xs text-slate-400">{connection?.workspaceId ?? "-"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p><strong className="text-ink">Agente conectado:</strong> {connection?.agentName ?? "Nao conectado"}</p>
                <p className="mt-1 text-xs text-slate-400">{connection?.agentId ?? "-"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p><strong className="text-ink">Ultima sincronizacao:</strong> {formatDateTime(connection?.lastSyncAt)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p><strong className="text-ink">Integracao:</strong> {health?.mockEnabled ? "Modo mock" : "Modo real"}</p>
                <p className="mt-1 text-xs text-slate-400">{health?.message ?? "Carregando status..."}</p>
              </div>
            </div>

            {isSuperAdmin ? (
              <div className="mt-5 rounded-2xl border border-line/80 bg-white p-4">
                {isConnected ? (
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-slate-600">A franquia ja esta conectada. Use o botao abaixo para trocar o agente se necessario.</p>
                    <button
                      type="button"
                      onClick={() => setIsProvisionFormOpen((current) => !current)}
                      className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      {isProvisionFormOpen ? "Cancelar troca" : "Trocar agente"}
                    </button>
                  </div>
                ) : null}

                {!isConnected || isProvisionFormOpen ? (
                  <div className="grid gap-4">
                    <div className="grid gap-1">
                      <h3 className="font-semibold text-ink">Criar agente GPTMaker e conectar</h3>
                      <p className="text-sm leading-6 text-slate-500">
                        Selecione uma workspace existente, revise o contexto base da franquia e conclua a conexao do agente.
                      </p>
                    </div>

                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-slate-700">Workspace</span>
                      <span className={`text-xs ${workspaceLoadError ? "text-rose-600" : "text-slate-500"}`}>
                        {workspaceLoadError ?? (isLoadingWorkspaces ? "Carregando workspaces..." : `${workspaces.length} workspace(s) disponivel(is)`)}
                      </span>
                      <select
                        className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                        value={selectedWorkspaceId}
                        onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                        disabled={isLoadingWorkspaces}
                      >
                        <option value="">Selecione uma workspace existente</option>
                        {workspaces.map((workspace) => (
                          <option key={workspace.id} value={workspace.id}>
                            {workspace.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-1.5">
                        <span className="text-sm font-medium text-slate-700">Nome do agente</span>
                        <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={agentName} onChange={(event) => setAgentName(event.target.value)} />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-sm font-medium text-slate-700">Tom</span>
                        <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={communicationType} onChange={(event) => setCommunicationType(event.target.value as "FORMAL" | "NORMAL" | "RELAXED")}>
                          <option value="FORMAL">FORMAL</option>
                          <option value="NORMAL">NORMAL</option>
                          <option value="RELAXED">RELAXED</option>
                        </select>
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-sm font-medium text-slate-700">Objetivo</span>
                        <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={objectiveType} onChange={(event) => setObjectiveType(event.target.value as "SUPPORT" | "SALE" | "PERSONAL")}>
                          <option value="SALE">SALE</option>
                          <option value="SUPPORT">SUPPORT</option>
                          <option value="PERSONAL">PERSONAL</option>
                        </select>
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-sm font-medium text-slate-700">Site</span>
                        <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={jobSite} onChange={(event) => setJobSite(event.target.value)} />
                      </label>
                      <label className="grid gap-1.5 md:col-span-2">
                        <span className="text-sm font-medium text-slate-700">Nome institucional</span>
                        <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={jobName} onChange={(event) => setJobName(event.target.value)} />
                      </label>
                      <label className="grid gap-1.5 md:col-span-2">
                        <span className="text-sm font-medium text-slate-700">Contexto base</span>
                        <textarea
                          className="min-h-[260px] rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                          value={jobDescription}
                          onChange={(event) => setJobDescription(event.target.value)}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleProvisionAgent()}
                      disabled={isSavingAgent || !selectedWorkspaceId}
                      className="inline-flex w-fit items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingAgent ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />}
                      Criar agente GPTMaker e conectar
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                O ADMIN_FRANQUIA ve apenas a conexao atual em modo leitura. Workspaces globais, diagnosticos e provisionamento ficam restritos ao SUPER_ADMIN.
              </div>
            )}
          </section>
        </div>

        <aside className="rounded-2xl bg-ink p-5 text-white shadow-soft">
          <h2 className="text-lg font-semibold">Resumo operacional</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Quando o agente GPTMaker e provisionado, o sistema salva workspace, agente, sincronizacao local e um treinamento inicial com o contexto padrao Vavive.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="font-semibold">Workspace atual</p>
              <p className="mt-1 text-white/70">{connection?.workspaceName ?? "Nao conectada"}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="font-semibold">Agente atual</p>
              <p className="mt-1 text-white/70">{connection?.agentName ?? "Nao conectado"}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="font-semibold">Ultima sincronizacao</p>
              <p className="mt-1 text-white/70">{formatDateTime(connection?.lastSyncAt)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="font-semibold">Contexto base</p>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-white/70">{defaultContext || "Carregando contexto padrao..."}</p>
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
