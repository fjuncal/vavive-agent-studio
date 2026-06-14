"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import {
  getFranchiseById,
  getFranchiseGptMakerConnection,
  getGptMakerWorkspaceAgentDiagnostics,
  getGptMakerDiagnostics,
  getGptMakerHealth,
  getGptMakerWorkspaceAgents,
  getGptMakerWorkspaces,
  updateFranchiseGptMakerConnection,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerAgentOption,
  type GptMakerDiagnostics,
  type GptMakerHealth,
  type GptMakerWorkspaceOption
} from "@/lib/api";
import { Bot, Loader2, PlugZap, RefreshCcw, ShieldCheck } from "lucide-react";
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
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [health, setHealth] = useState<GptMakerHealth | null>(null);
  const [diagnostics, setDiagnostics] = useState<GptMakerDiagnostics | null>(null);
  const [workspaces, setWorkspaces] = useState<GptMakerWorkspaceOption[]>([]);
  const [agents, setAgents] = useState<GptMakerAgentOption[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [workspaceLoadError, setWorkspaceLoadError] = useState<string | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null);
  const [agentReloadKey, setAgentReloadKey] = useState(0);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isConnected = connection?.status === "CONECTADO";
  const selectedAgent = useMemo(() => agents.find((item) => item.id === selectedAgentId) ?? null, [agents, selectedAgentId]);

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getGptMakerHealth()
    ])
      .then(([franchiseData, connectionData, healthData]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setHealth(healthData);
        setSelectedWorkspaceId(connectionData.workspaceId ?? "");
        setSelectedAgentId(connectionData.agentId ?? "");
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar a franquia.");
      })
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setWorkspaceLoadError("Apenas SUPER_ADMIN pode carregar e vincular workspaces GPTMaker.");
      return;
    }

    setIsLoadingWorkspaces(true);
    setWorkspaceLoadError(null);
    getGptMakerWorkspaces()
      .then((items) => {
        setWorkspaces(items);
      })
      .catch((requestError) => {
        const message = requestError instanceof Error ? requestError.message : "Erro ao carregar workspaces";
        setWorkspaceLoadError(message);
        setError(message);
      })
      .finally(() => setIsLoadingWorkspaces(false));
  }, [isSuperAdmin]);

  async function loadAgents(workspaceId: string) {
    setIsLoadingAgents(true);
    setAgentLoadError(null);
    try {
      const items = await getGptMakerWorkspaceAgents(workspaceId);
      setAgents(items);
      if (!items.some((item) => item.id === selectedAgentId)) {
        setSelectedAgentId("");
      }
      if (isSuperAdmin) {
        const diagnostics = await getGptMakerWorkspaceAgentDiagnostics(workspaceId);
        if (diagnostics.status === "ERROR") {
          setAgentLoadError(diagnostics.message);
        }
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os agentes do workspace.";
      setAgentLoadError(message);
      setError(message);
    } finally {
      setIsLoadingAgents(false);
    }
  }

  useEffect(() => {
    if (!selectedWorkspaceId || !isSuperAdmin) {
      setAgents([]);
      setAgentLoadError(null);
      return;
    }

    void loadAgents(selectedWorkspaceId);
  }, [agentReloadKey, isSuperAdmin, selectedWorkspaceId]);

  const workspaceStatusMessage = isLoadingWorkspaces
    ? "Carregando..."
    : workspaceLoadError
      ? "Erro ao carregar workspaces"
      : workspaces.length === 0
        ? "Nenhum workspace retornado pela API GPTMaker."
        : `Workspace(s) encontrado(s): ${workspaces.length}`;

  async function handleSaveConnection() {
    if (!params?.id || !selectedWorkspaceId || !selectedAgentId) {
      setError("Selecione um workspace e um agente GPTMaker antes de salvar.");
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await updateFranchiseGptMakerConnection(params.id, {
        workspaceId: selectedWorkspaceId,
        agentId: selectedAgentId
      });
      setConnection(response);
      setSuccess("Conexao GPTMaker salva com sucesso para esta franquia.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar o vinculo GPTMaker.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDiagnostics() {
    setIsRunningDiagnostics(true);
    setError(null);
    try {
      const response = await getGptMakerDiagnostics();
      setDiagnostics(response);
      if (response.status === "CONNECTED") {
        setSuccess(`Conexao validada. ${response.workspaceCount} workspace(s) encontrado(s).`);
      } else {
        setSuccess(null);
        setError(response.message);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel executar o diagnostico GPTMaker.");
      setSuccess(null);
    } finally {
      setIsRunningDiagnostics(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Franquia"
        title={franchise?.name ?? "Carregando franquia"}
        description={
          franchise
            ? `${franchise.city} / ${franchise.state}. Configure qual workspace e qual agente GPTMaker representam esta unidade.`
            : "Buscando dados da franquia no backend."
        }
      />

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Status da conexao" value={isLoading ? "..." : isConnected ? "Conectado" : "Pendente"} hint="Workspace e agente vinculados por franquia" icon={PlugZap} />
        <StatCard label="Workspace" value={isLoading ? "..." : connection?.workspaceName ?? "Nao conectado"} hint="Origem do catalogo GPTMaker" icon={ShieldCheck} />
        <StatCard label="Agente" value={isLoading ? "..." : connection?.agentName ?? "Nao conectado"} hint="Agente real associado a esta unidade" icon={Bot} />
        <StatCard label="Ultima sincronizacao" value={isLoading ? "..." : formatDateTime(connection?.lastSyncAt)} hint="Momento em que o vinculo foi salvo" icon={RefreshCcw} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-ink">Conexao GPTMaker</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Cada franquia deve apontar para um workspace e um agente GPTMaker reais antes de evoluirmos para atendimento e conversas.
              </p>
            </div>
            <StatusBadge status={connection?.status ?? "NAO_CONECTADO"} />
          </div>

          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p><strong className="text-ink">Workspace conectado:</strong> {connection?.workspaceName ?? "Nao conectado"}</p>
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
            <div className="mt-6 grid gap-4 rounded-2xl border border-line/80 bg-white p-4">
              <div className="grid gap-1">
                <h3 className="font-semibold text-ink">Vincular franquia a um agente GPTMaker</h3>
                <p className="text-sm leading-6 text-slate-500">
                  Escolha primeiro o workspace da conta e depois o agente que representa esta unidade.
                </p>
              </div>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Workspace GPTMaker</span>
                <span className={`text-xs ${workspaceLoadError ? "text-rose-600" : "text-slate-500"}`}>
                  {workspaceLoadError ?? workspaceStatusMessage}
                </span>
                <select
                  className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                  value={selectedWorkspaceId}
                  disabled={isLoadingWorkspaces || !!workspaceLoadError}
                  onChange={(event) => {
                    setSelectedWorkspaceId(event.target.value);
                    setSelectedAgentId("");
                  }}
                >
                  <option value="">Selecione um workspace</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Agente GPTMaker</span>
                <span className={`text-xs ${agentLoadError ? "text-rose-600" : "text-slate-500"}`}>
                  {!selectedWorkspaceId
                    ? "Selecione um workspace para carregar os agentes"
                    : isLoadingAgents
                      ? "Carregando..."
                      : agentLoadError
                        ? "Erro ao carregar agentes"
                        : agents.length === 0
                          ? "Nenhum agente retornado para este workspace GPTMaker."
                          : `Agente(s) encontrado(s): ${agents.length}`}
                </span>
                <select
                  className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                  value={selectedAgentId}
                  onChange={(event) => setSelectedAgentId(event.target.value)}
                  disabled={!selectedWorkspaceId || isLoadingAgents || !!agentLoadError}
                >
                  <option value="">{isLoadingAgents ? "Carregando agentes..." : "Selecione um agente"}</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}{agent.jobName ? ` · ${agent.jobName}` : agent.type ? ` · ${agent.type}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              {agentLoadError ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <span>{agentLoadError}</span>
                  {selectedWorkspaceId ? (
                    <button
                      type="button"
                      onClick={() => setAgentReloadKey((current) => current + 1)}
                      className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      Tentar novamente
                    </button>
                  ) : null}
                </div>
              ) : null}

              {selectedAgent ? (
                <div className="rounded-xl bg-mist p-4 text-sm text-slate-600">
                  <p><strong className="text-ink">Comportamento:</strong> {selectedAgent.behavior ?? "Nao informado"}</p>
                  <p className="mt-1"><strong className="text-ink">Tipo de comunicacao:</strong> {selectedAgent.communicationType ?? "Nao informado"}</p>
                  <p className="mt-1"><strong className="text-ink">Objetivo:</strong> {selectedAgent.type ?? "Nao informado"}</p>
                  <p className="mt-1"><strong className="text-ink">Funcao:</strong> {selectedAgent.jobName ?? "Nao informada"}</p>
                  <p className="mt-1"><strong className="text-ink">Descricao:</strong> {selectedAgent.jobDescription ?? "Nao informada"}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveConnection()}
                  disabled={isSaving || !selectedWorkspaceId || !selectedAgentId}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />}
                  Salvar vinculo
                </button>
                <Link href="/setup-guiado" className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">
                  Abrir setup guiado
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDiagnostics()}
                  disabled={isRunningDiagnostics}
                  className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRunningDiagnostics ? "Testando..." : "Testar conexao GPTMaker"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Apenas SUPER_ADMIN pode carregar e vincular workspaces GPTMaker.
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-ink p-5 text-white shadow-soft">
          <h2 className="text-lg font-semibold">Status da conexao</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Antes de publicar treinamentos ou evoluir para atendimento, a franquia precisa estar conectada a um agente GPTMaker real.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="font-semibold">Workspace atual</p>
              <p className="mt-1 text-white/70">{connection?.workspaceName ?? "Nao conectado"}</p>
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
              <p className="font-semibold">Health da integracao</p>
              <p className="mt-1 text-white/70">{health?.status ?? "Carregando..."}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="font-semibold">Diagnostico GPTMaker</p>
              <div className="mt-2">
                <StatusBadge status={diagnostics?.status ?? "MOCK"} />
              </div>
              <p className="mt-2 text-white/70">{diagnostics?.message ?? "Use o botao de teste para validar a conexao real."}</p>
              <p className="mt-2 text-xs text-white/60">Workspaces encontrados: {diagnostics?.workspaceCount ?? 0}</p>
              {diagnostics?.details ? <p className="mt-2 text-xs text-white/60">{diagnostics.details}</p> : null}
              {diagnostics?.status === "ERROR" ? (
                <div className="mt-3 space-y-1 text-xs text-white/60">
                  {diagnostics.httpStatus ? <p>HTTP: {diagnostics.httpStatus}</p> : null}
                  {diagnostics.errorCode ? <p>Codigo: {diagnostics.errorCode}</p> : null}
                  {diagnostics.endpoint ? <p>Endpoint: {diagnostics.endpoint}</p> : null}
                  {diagnostics.responsePreview ? <p>Resposta: {diagnostics.responsePreview}</p> : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
