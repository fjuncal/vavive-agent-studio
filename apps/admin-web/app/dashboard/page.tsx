"use client";

import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  getAgentTrainings,
  getAgents,
  getDashboardSummary,
  getFranchises,
  getFranchiseSetup,
  getGptMakerHealth,
  getGptMakerWorkspaces,
  getLeads,
  type AgentSummary,
  type DashboardSummary,
  type FranchiseSetup,
  type FranchiseSummary,
  type GptMakerHealth,
  type GptMakerWorkspaceOption,
  type LeadSummary,
  type TrainingSummary
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Bot, Building2, FileText, MessageCircle, PlugZap, TrendingUp, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatDate(value?: string | null) {
  if (!value) {
    return "Ainda nao publicado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatSetupStatus(value?: string | null) {
  return value?.replaceAll("_", " ") || "NAO INICIADO";
}

export default function DashboardPage() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [health, setHealth] = useState<GptMakerHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [lastIntegrationCheck, setLastIntegrationCheck] = useState<string | null>(null);

  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [franchiseError, setFranchiseError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<GptMakerWorkspaceOption[]>([]);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const [franchiseSetup, setFranchiseSetup] = useState<FranchiseSetup | null>(null);
  const [franchiseSetupError, setFranchiseSetupError] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<TrainingSummary[]>([]);
  const [trainingsError, setTrainingsError] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const connectedFranchises = franchises.filter((franchise) => franchise.workspaceId && franchise.agentId).length;
  const connectedAgents = agents.filter((agent) => agent.connectedToRealGptMaker).length;
  const currentAgent = useMemo(
    () => agents.find((agent) => agent.connectedToRealGptMaker) ?? agents[0] ?? null,
    [agents]
  );
  const recentLeads = leads.slice(0, 4);
  const integrationStatus = healthError ? "Nao conectado" : health?.status === "READY" || workspaces.length > 0 ? "Conectado" : "Nao conectado";

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    setSummaryError(null);
    getDashboardSummary()
      .then(setSummary)
      .catch((requestError) => {
        setSummaryError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o resumo.");
      });

    setLeadsError(null);
    getLeads()
      .then(setLeads)
      .catch((requestError) => {
        setLeadsError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os leads.");
      });

    setHealthError(null);
    getGptMakerHealth()
      .then((response) => {
        setHealth(response);
        setLastIntegrationCheck(new Date().toLocaleString("pt-BR"));
      })
      .catch((requestError) => {
        setHealthError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o status da integracao.");
        setLastIntegrationCheck(new Date().toLocaleString("pt-BR"));
      });
  }, [isAuthLoading, user]);

  useEffect(() => {
    if (isAuthLoading || !user || !isSuperAdmin) {
      setFranchises([]);
      setAgents([]);
      setWorkspaces([]);
      return;
    }

    setFranchiseError(null);
    getFranchises()
      .then(setFranchises)
      .catch((requestError) => {
        setFranchiseError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as franquias.");
      });

    setAgentsError(null);
    getAgents()
      .then(setAgents)
      .catch((requestError) => {
        setAgentsError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os agentes.");
      });

    setWorkspaceError(null);
    getGptMakerWorkspaces()
      .then(setWorkspaces)
      .catch((requestError) => {
        setWorkspaceError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os workspaces GPTMaker.");
      });
  }, [isAuthLoading, isSuperAdmin, user]);

  useEffect(() => {
    if (isAuthLoading || !user || user.role !== "ADMIN_FRANQUIA") {
      setFranchiseSetup(null);
      setTrainings([]);
      setAgents([]);
      return;
    }

    const franchiseId = user.franchise?.id;
    if (!franchiseId) {
      setFranchiseSetupError("Usuario ADMIN_FRANQUIA nao possui franquia associada.");
      setAgentsError("Usuario ADMIN_FRANQUIA nao possui franquia associada.");
      return;
    }

    setFranchiseSetupError(null);
    getFranchiseSetup(franchiseId)
      .then(setFranchiseSetup)
      .catch((requestError) => {
        setFranchiseSetupError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar a configuracao da franquia.");
      });

    setAgentsError(null);
    getAgents()
      .then((items) => {
        setAgents(items);
        const firstAgent = items[0];
        if (!firstAgent) {
          setTrainings([]);
          return;
        }

        setTrainingsError(null);
        getAgentTrainings(firstAgent.id)
          .then((items) => setTrainings(items.slice(0, 3)))
          .catch((requestError) => {
            setTrainingsError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os treinamentos.");
          });
      })
      .catch((requestError) => {
        setAgentsError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os agentes.");
      });
  }, [isAuthLoading, user]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operacao Vavive"
        title="Dashboard"
        description={isSuperAdmin ? "Visao executiva da rede e da integracao GPTMaker." : "Visao operacional da sua franquia."}
      />

      {isSuperAdmin ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total de franquias" value={String(franchises.length)} hint={franchiseError ?? "Dados reais do backend"} icon={Building2} />
          <StatCard label="Franquias conectadas" value={String(connectedFranchises)} hint="Com workspace e agente vinculados" icon={PlugZap} />
          <StatCard label="Agentes conectados" value={String(connectedAgents)} hint={agentsError ?? "Agentes reais cadastrados"} icon={Bot} />
          <StatCard label="Leads reais" value={String(summary?.totalLeads ?? leads.length)} hint={summaryError ?? "Base de leads do backend"} icon={UsersRound} />
          <StatCard label="Workspaces GPTMaker" value={String(workspaces.length)} hint={workspaceError ?? "Disponiveis para vinculo"} icon={PlugZap} />
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Sua franquia" value={user?.franchise?.name ?? "Nao associada"} hint={user?.franchise ? `${user.franchise.city} / ${user.franchise.state}` : "Verifique o cadastro"} icon={Building2} />
          <StatCard label="Leads da franquia" value={String(summary?.totalLeads ?? leads.length)} hint={summaryError ?? "Dados reais do backend"} icon={MessageCircle} />
          <StatCard label="Agente conectado" value={currentAgent?.name ?? "Nao conectado"} hint={agentsError ?? currentAgent?.connectionStatus ?? "Aguardando vinculo"} icon={Bot} />
          <StatCard label="Treinamentos" value={String(trainings.length)} hint={trainingsError ?? "Ultimos registros salvos"} icon={FileText} />
          <StatCard label="Configuracao" value={`${franchiseSetup?.completionPercentage ?? summary?.completionPercentage ?? 0}%`} hint={franchiseSetupError ?? formatSetupStatus(franchiseSetup?.setupStatus ?? summary?.setupStatus)} icon={TrendingUp} />
        </section>
      )}

      <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">GPTMaker</p>
            <h2 className="mt-2 text-lg font-semibold text-ink">Status da integracao</h2>
            <p className="mt-2 text-sm text-slate-500">
              {healthError ?? health?.message ?? "Consultando status da integracao."}
            </p>
          </div>
          <StatusBadge status={integrationStatus === "Conectado" ? "CONNECTED" : "ERROR"} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</p>
            <p className="mt-2 text-sm font-semibold text-ink">{integrationStatus}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Workspaces encontrados</p>
            <p className="mt-2 text-sm font-semibold text-ink">{isSuperAdmin ? workspaces.length : "Restrito ao SUPER_ADMIN"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Ambiente</p>
            <p className="mt-2 text-sm font-semibold text-ink">{health?.mockEnabled ? "Ambiente de desenvolvimento" : "Integracao ativa"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Ultima verificacao</p>
            <p className="mt-2 text-sm font-semibold text-ink">{lastIntegrationCheck ?? "Pendente"}</p>
          </div>
        </div>
      </section>

      {isSuperAdmin ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Workspaces GPTMaker</h2>
            {workspaceError ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{workspaceError}</p> : null}
            {workspaces.length ? (
              <div className="mt-4 grid gap-3">
                {workspaces.slice(0, 5).map((workspace) => (
                  <div key={workspace.id} className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-ink">{workspace.name || "Workspace sem nome"}</p>
                    <p className="mt-1 text-sm text-slate-500">Disponivel para conectar franquias.</p>
                  </div>
                ))}
              </div>
            ) : !workspaceError ? (
              <EmptyState icon={PlugZap} title="Nenhum workspace encontrado" description="Ainda nao ha dados reais para exibir." />
            ) : null}
          </section>

          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Franquias recentes</h2>
            {franchiseError ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{franchiseError}</p> : null}
            {franchises.length ? (
              <div className="mt-4 grid gap-3">
                {franchises.slice(0, 5).map((franchise) => (
                  <div key={franchise.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-ink">{franchise.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{franchise.city} / {franchise.state}</p>
                    </div>
                    <StatusBadge status={franchise.workspaceId && franchise.agentId ? "CONECTADO" : "PENDENTE"} />
                  </div>
                ))}
              </div>
            ) : !franchiseError ? (
              <EmptyState icon={Building2} title="Nenhuma franquia cadastrada" description="Ainda nao ha dados reais para exibir." />
            ) : null}
          </section>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Agente da franquia</h2>
            {agentsError ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{agentsError}</p> : null}
            {currentAgent ? (
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{currentAgent.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{currentAgent.connectionStatus}</p>
                  </div>
                  <StatusBadge status={currentAgent.status} />
                </div>
              </div>
            ) : !agentsError ? (
              <EmptyState icon={Bot} title="Nenhum agente conectado" description="A conexao com o GPTMaker pode ser configurada pelo SUPER_ADMIN." />
            ) : null}
          </section>

          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Ultimos treinamentos</h2>
            {trainingsError ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{trainingsError}</p> : null}
            {trainings.length ? (
              <div className="mt-4 grid gap-3">
                {trainings.map((training) => (
                  <div key={training.id} className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{training.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(training.createdAt)}</p>
                      </div>
                      <StatusBadge status={training.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : !trainingsError ? (
              <EmptyState icon={FileText} title="Nenhum treinamento salvo" description="Ainda nao ha dados reais para exibir." />
            ) : null}
          </section>
        </section>
      )}

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-ink">Leads recentes</h2>
        {leadsError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{leadsError}</p> : null}
        {recentLeads.length ? (
          <DataTable
            rows={recentLeads}
            columns={[
              { header: "Nome", cell: (lead) => <span className="font-semibold text-ink">{lead.name}</span> },
              { header: "Servico", cell: (lead) => lead.service },
              { header: "Origem", cell: (lead) => lead.source },
              ...(isSuperAdmin ? [{ header: "Franquia", cell: (lead: LeadSummary) => lead.franchiseName }] : []),
              { header: "Status", cell: (lead) => <StatusBadge status={lead.status} /> }
            ]}
          />
        ) : !leadsError ? (
          <EmptyState icon={MessageCircle} title="Nenhum lead recente" description="Ainda nao ha dados reais para exibir." />
        ) : null}
      </section>
    </AppShell>
  );
}
