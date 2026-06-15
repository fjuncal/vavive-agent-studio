"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import {
  createFranchiseAdminUser,
  getFranchiseAdminUser,
  getFranchiseById,
  getFranchiseDefaultContext,
  getFranchiseGptMakerConnection,
  getGptMakerHealth,
  getGptMakerWorkspaceAgents,
  getGptMakerWorkspaces,
  linkFranchiseWorkspace,
  provisionFranchiseGptMakerAgent,
  updateFranchiseGptMakerConnection,
  type FranchiseAdminUser,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerAgentOption,
  type GptMakerHealth,
  type GptMakerWorkspaceOption
} from "@/lib/api";
import { Bot, Building2, CheckCircle2, Loader2, PlugZap, UserRound } from "lucide-react";
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

const avatarOptions = [
  { label: "Sem avatar", value: "" },
  { label: "Profissional feminino", value: "https://assets.vavive.com/avatar-profissional-feminino.png" },
  { label: "Profissional masculino", value: "https://assets.vavive.com/avatar-profissional-masculino.png" },
  { label: "Neutro Vavive", value: "https://assets.vavive.com/avatar-neutro-vavive.png" }
];

export default function FranchiseDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [health, setHealth] = useState<GptMakerHealth | null>(null);
  const [adminUser, setAdminUser] = useState<FranchiseAdminUser | null>(null);
  const [workspaces, setWorkspaces] = useState<GptMakerWorkspaceOption[]>([]);
  const [workspaceAgents, setWorkspaceAgents] = useState<GptMakerAgentOption[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedExistingAgentId, setSelectedExistingAgentId] = useState("");
  const [connectionMode, setConnectionMode] = useState<"link" | "create">("link");
  const [agentName, setAgentName] = useState("");
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [jobName, setJobName] = useState("Vavive");
  const [jobSite, setJobSite] = useState("https://vavive.com.br");
  const [jobDescription, setJobDescription] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [agentListError, setAgentListError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingWorkspaceAgents, setIsLoadingWorkspaceAgents] = useState(false);

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
        setAgentName(connectionData.agentName ?? `Assistente Vavive - ${franchiseData.name}`);
        setJobDescription(contextData?.context ?? "");
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
    setWorkspaceError(null);
    getGptMakerWorkspaces()
      .then(setWorkspaces)
      .catch((requestError) => {
        setWorkspaceError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os workspaces GPTMaker.");
      })
      .finally(() => setIsLoadingWorkspaces(false));
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin || !selectedWorkspaceId) {
      setWorkspaceAgents([]);
      setSelectedExistingAgentId("");
      return;
    }

    setIsLoadingWorkspaceAgents(true);
    setAgentListError(null);
    getGptMakerWorkspaceAgents(selectedWorkspaceId)
      .then((items) => {
        setWorkspaceAgents(items);
        setSelectedExistingAgentId(items[0]?.id ?? "");
      })
      .catch((requestError) => {
        setWorkspaceAgents([]);
        setSelectedExistingAgentId("");
        setAgentListError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os agentes deste workspace.");
      })
      .finally(() => setIsLoadingWorkspaceAgents(false));
  }, [isSuperAdmin, selectedWorkspaceId]);

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

  async function handleLinkExistingAgent() {
    if (!params?.id || !selectedWorkspaceId || !selectedExistingAgentId) {
      setError("Selecione um workspace e um agente GPTMaker existente.");
      setSuccess(null);
      return;
    }

    setIsSavingAgent(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await updateFranchiseGptMakerConnection(params.id, {
        workspaceId: selectedWorkspaceId,
        agentId: selectedExistingAgentId
      });
      setConnection(response);
      setSuccess("Agente existente vinculado a franquia com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel vincular o agente existente.");
    } finally {
      setIsSavingAgent(false);
    }
  }

  async function handleLinkWorkspace() {
    if (!params?.id || !selectedWorkspaceId) {
      setError("Selecione uma workspace GPTMaker existente.");
      setSuccess(null);
      return;
    }

    setIsSavingAgent(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await linkFranchiseWorkspace(params.id, {
        workspaceId: selectedWorkspaceId,
        workspaceName: selectedWorkspace?.name
      });
      setConnection(response);
      setFranchise((current) => current ? {
        ...current,
        workspaceId: response.workspaceId,
        workspaceName: response.workspaceName,
        agentId: response.agentId,
        agentName: response.agentName,
        gptMakerLastSyncAt: response.lastSyncAt
      } : current);
      setSuccess("Workspace GPTMaker vinculada a franquia.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel vincular a workspace.");
    } finally {
      setIsSavingAgent(false);
    }
  }

  async function handleProvisionAgent() {
    if (!params?.id || !selectedWorkspaceId) {
      setError("Selecione um workspace GPTMaker existente.");
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
        avatar: selectedAvatar || undefined,
        communicationType,
        type: objectiveType,
        jobName,
        jobSite,
        jobDescription
      });
      setConnection(response);
      setSuccess("Agente GPTMaker criado e conectado com sucesso.");
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
        description="Cadastre a unidade e o administrador primeiro. A conexao com o GPTMaker e uma etapa opcional e pode ser feita depois."
      />

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      <section className="grid gap-4 lg:grid-cols-5">
        <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <Building2 className="text-brand-700" size={22} />
          <h2 className="mt-4 font-semibold text-ink">Dados da franquia</h2>
          <p className="mt-2 text-sm text-slate-500">{franchise ? `${franchise.city} / ${franchise.state}` : "Carregando..."}</p>
          <StatusBadge status={franchise?.status ?? "PENDENTE"} />
        </article>
        <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <UserRound className="text-brand-700" size={22} />
          <h2 className="mt-4 font-semibold text-ink">Administrador</h2>
          <p className="mt-2 text-sm text-slate-500">{adminUser ? adminUser.email : "Ainda nao cadastrado"}</p>
          <StatusBadge status={adminUser ? "ATIVO" : "PENDENTE"} />
        </article>
        <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <PlugZap className="text-brand-700" size={22} />
          <h2 className="mt-4 font-semibold text-ink">Conexao GPTMaker</h2>
          <p className="mt-2 text-sm text-slate-500">{connection?.workspaceName ?? "Nao conectada"}</p>
          <StatusBadge status={connection?.status ?? "NAO_CONECTADO"} />
        </article>
        <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <Bot className="text-brand-700" size={22} />
          <h2 className="mt-4 font-semibold text-ink">Agente conectado</h2>
          <p className="mt-2 text-sm text-slate-500">{connection?.agentName ?? "Nenhum agente vinculado"}</p>
          <StatusBadge status={isConnected ? "ATIVO" : "PENDENTE"} />
        </article>
        <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <CheckCircle2 className="text-brand-700" size={22} />
          <h2 className="mt-4 font-semibold text-ink">Proximos passos</h2>
          <p className="mt-2 text-sm text-slate-500">{adminUser ? "Franqueado ja pode acessar." : "Crie o administrador."}</p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Etapa 1: dados da franquia</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p><strong className="text-ink">Nome:</strong> {franchise?.name ?? "-"}</p>
            <p><strong className="text-ink">Documento:</strong> {franchise?.document ?? "-"}</p>
            <p><strong className="text-ink">Cidade:</strong> {franchise?.city ?? "-"}</p>
            <p><strong className="text-ink">Estado:</strong> {franchise?.state ?? "-"}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Etapa 2: administrador da franquia</h2>
          {adminUser ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p><strong className="text-ink">Nome:</strong> {adminUser.name}</p>
              <p className="mt-1"><strong className="text-ink">Email:</strong> {adminUser.email}</p>
              <p className="mt-1">Este usuario ja pode acessar a plataforma como ADMIN_FRANQUIA.</p>
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
              <button
                type="button"
                onClick={() => void handleCreateAdminUser()}
                disabled={isSavingAdmin}
                className="w-fit rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingAdmin ? "Salvando..." : "Criar administrador"}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Administrador ainda nao cadastrado.</p>
          )}
        </section>
      </section>

      <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Etapas 3 e 4: conexao GPTMaker</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Opcional para o login do franqueado. Use um agente existente quando o workspace ja estiver no limite.
            </p>
          </div>
          <StatusBadge status={connection?.status ?? "NAO_CONECTADO"} />
        </div>

        <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-semibold text-ink">Workspace atual</p>
            <p className="mt-1">{connection?.workspaceName ?? "Nao conectado"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-semibold text-ink">Agente atual</p>
            <p className="mt-1">{connection?.agentName ?? "Nao conectado"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-semibold text-ink">Ultima atualizacao</p>
            <p className="mt-1">{formatDateTime(connection?.lastSyncAt)}</p>
          </div>
        </div>

        {!isSuperAdmin ? (
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            A conexao GPTMaker e gerenciada pelo SUPER_ADMIN. O franqueado pode operar a propria unidade sem acessar workspaces globais.
          </p>
        ) : (
          <div className="mt-5 grid gap-5">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Workspace GPTMaker</span>
              <span className={`text-xs ${workspaceError ? "text-rose-600" : "text-slate-500"}`}>
                {workspaceError ?? (isLoadingWorkspaces ? "Carregando workspaces..." : `${workspaces.length} workspace(s) disponivel(is)`)}
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

            {selectedWorkspaceId && selectedWorkspaceId !== connection?.workspaceId ? (
              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Workspace selecionada ainda nao esta salva nesta franquia.</p>
                <p className="mt-1">Ao trocar a workspace, o agente conectado anteriormente sera removido para evitar vinculo incorreto.</p>
                <button
                  type="button"
                  onClick={() => void handleLinkWorkspace()}
                  disabled={isSavingAgent}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingAgent ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />}
                  Linkar workspace
                </button>
              </div>
            ) : null}

            {connection?.workspaceId ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConnectionMode("link")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${connectionMode === "link" ? "bg-ink text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  Vincular agente existente
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMode("create")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${connectionMode === "create" ? "bg-ink text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  Criar novo agente GPTMaker
                </button>
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Linke uma workspace antes de vincular ou criar o agente GPTMaker.</p>
            )}

            {connection?.workspaceId && connectionMode === "link" ? (
              <div className="rounded-2xl border border-line/80 bg-white p-4">
                <h3 className="font-semibold text-ink">Vincular agente existente</h3>
                <p className="mt-2 text-sm text-slate-500">Ideal quando o workspace ja possui agentes criados ou atingiu o limite no GPTMaker.</p>
                {agentListError ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{agentListError}</p> : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                    value={selectedExistingAgentId}
                    onChange={(event) => setSelectedExistingAgentId(event.target.value)}
                    disabled={!selectedWorkspaceId || isLoadingWorkspaceAgents}
                  >
                    <option value="">{isLoadingWorkspaceAgents ? "Carregando agentes..." : "Selecione um agente"}</option>
                    {workspaceAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleLinkExistingAgent()}
                    disabled={isSavingAgent || !selectedWorkspaceId || !selectedExistingAgentId}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingAgent ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />}
                    Vincular agente a franquia
                  </button>
                </div>
                {!isLoadingWorkspaceAgents && selectedWorkspaceId && !workspaceAgents.length && !agentListError ? (
                  <EmptyState icon={Bot} title="Nenhum agente encontrado" description="Este workspace nao retornou agentes disponiveis para vinculo." />
                ) : null}
              </div>
            ) : connection?.workspaceId ? (
              <div className="rounded-2xl border border-line/80 bg-white p-4">
                <h3 className="font-semibold text-ink">Criar novo agente GPTMaker</h3>
                <p className="mt-2 text-sm text-slate-500">Use esta opcao somente quando o workspace permitir novos agentes.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Nome do agente</span>
                    <input className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={agentName} onChange={(event) => setAgentName(event.target.value)} />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Tom</span>
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
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Avatar</span>
                    <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" value={selectedAvatar} onChange={(event) => setSelectedAvatar(event.target.value)}>
                      {avatarOptions.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
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
                      className="min-h-[180px] rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                      value={jobDescription}
                      onChange={(event) => setJobDescription(event.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void handleProvisionAgent()}
                  disabled={isSavingAgent || !selectedWorkspaceId}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingAgent ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />}
                  Criar e conectar agente
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {isSuperAdmin && health ? (
        <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Status da integracao</h2>
          <p className="mt-2 text-sm text-slate-500">{health.message}</p>
          <p className="mt-3 text-sm font-semibold text-ink">{health.mockEnabled ? "Ambiente de desenvolvimento" : "Integracao ativa"}</p>
        </section>
      ) : null}
    </AppShell>
  );
}
