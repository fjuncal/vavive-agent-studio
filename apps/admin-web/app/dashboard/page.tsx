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
  getLeads,
  type AgentSummary,
  type DashboardSummary,
  type FranchiseSetup,
  type FranchiseSummary,
  type LeadSummary,
  type TrainingSummary
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Bot, Building2, FileText, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatDate(value?: string | null) {
  if (!value) {
    return "Ainda não publicado";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function DashboardPage() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [franchiseError, setFranchiseError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const [franchiseSetup, setFranchiseSetup] = useState<FranchiseSetup | null>(null);
  const [franchiseSetupError, setFranchiseSetupError] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<TrainingSummary[]>([]);
  const [trainingsError, setTrainingsError] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const connectedFranchises = franchises.filter((franchise) => franchise.workspaceId && franchise.agentId).length;
  const currentAgent = useMemo(
    () => agents[0] ?? null,
    [agents]
  );
  const recentLeads = leads.slice(0, 4);

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    setSummaryError(null);
    getDashboardSummary()
      .then(setSummary)
      .catch((requestError) => {
        setSummaryError(requestError instanceof Error ? requestError.message : "Não foi possível carregar o resumo.");
      });

    setLeadsError(null);
    getLeads()
      .then(setLeads)
      .catch((requestError) => {
        setLeadsError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os leads.");
      });
  }, [isAuthLoading, user]);

  useEffect(() => {
    if (isAuthLoading || !user || !isSuperAdmin) {
      setFranchises([]);
      setAgents([]);
      return;
    }

    setFranchiseError(null);
    getFranchises()
      .then(setFranchises)
      .catch((requestError) => {
        setFranchiseError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as franquias.");
      });

    setAgentsError(null);
    getAgents()
      .then(setAgents)
      .catch((requestError) => {
        setAgentsError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os agentes.");
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
      setFranchiseSetupError("Usuário não possui franquia associada.");
      setAgentsError("Usuário não possui franquia associada.");
      return;
    }

    setFranchiseSetupError(null);
    getFranchiseSetup(franchiseId)
      .then(setFranchiseSetup)
      .catch((requestError) => {
        setFranchiseSetupError(requestError instanceof Error ? requestError.message : "Não foi possível carregar a configuração da franquia.");
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
            setTrainingsError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os treinamentos.");
          });
      })
      .catch((requestError) => {
        setAgentsError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os agentes.");
      });
  }, [isAuthLoading, user]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Visão Geral"
        title="Dashboard"
        description={isSuperAdmin ? "Acompanhe o desempenho da rede." : "Acompanhe o desempenho da sua franquia."}
      />

      {isSuperAdmin ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Franquias ativas" value={String(connectedFranchises)} hint={franchiseError ?? "Com agente configurado"} icon={Building2} />
          <StatCard label="Franquias pendentes" value={String(franchises.length - connectedFranchises)} hint="Aguardando configuração" icon={Building2} />
          <StatCard label="Agentes configurados" value={String(agents.length)} hint={agentsError ?? "Total de agentes"} icon={Bot} />
          <StatCard label="Atendimentos" value={String(summary?.totalLeads ?? leads.length)} hint={summaryError ?? "Leads registrados"} icon={MessageCircle} />
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Minha franquia" value={user?.franchise?.name ?? "Não associada"} hint={user?.franchise ? `${user.franchise.city} / ${user.franchise.state}` : "Verifique o cadastro"} icon={Building2} />
          <StatCard label="Meu agente" value={currentAgent?.name ?? "Não configurado"} hint={agentsError ?? currentAgent?.status ?? "Aguardando"} icon={Bot} />
          <StatCard label="Treinamentos" value={String(trainings.length)} hint={trainingsError ?? "Últimos registros"} icon={FileText} />
          <StatCard label="Atendimentos" value={String(summary?.totalLeads ?? leads.length)} hint={summaryError ?? "Leads registrados"} icon={MessageCircle} />
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        {isSuperAdmin ? (
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
              <EmptyState icon={Building2} title="Nenhuma franquia cadastrada" description="Ainda não há dados para exibir." />
            ) : null}
          </section>
        ) : (
          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Meu agente</h2>
            {agentsError ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{agentsError}</p> : null}
            {currentAgent ? (
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{currentAgent.name}</p>
                  </div>
                  <StatusBadge status={currentAgent.status} />
                </div>
              </div>
            ) : !agentsError ? (
              <EmptyState icon={Bot} title="Nenhum agente configurado" description="A configuração pode ser feita pelo administrador." />
            ) : null}
          </section>
        )}

        {isSuperAdmin ? (
          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Agentes configurados</h2>
            {agentsError ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{agentsError}</p> : null}
            {agents.length ? (
              <div className="mt-4 grid gap-3">
                {agents.slice(0, 5).map((agent) => (
                  <div key={agent.id} className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-ink">{agent.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{agent.franchiseName}</p>
                  </div>
                ))}
              </div>
            ) : !agentsError ? (
              <EmptyState icon={Bot} title="Nenhum agente configurado" description="Ainda não há dados para exibir." />
            ) : null}
          </section>
        ) : (
          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Últimos treinamentos</h2>
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
              <EmptyState icon={FileText} title="Nenhum treinamento salvo" description="Ainda não há dados para exibir." />
            ) : null}
          </section>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-ink">Atendimentos recentes</h2>
        {leadsError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{leadsError}</p> : null}
        {recentLeads.length ? (
          <DataTable
            rows={recentLeads}
            columns={[
              { header: "Nome", cell: (lead) => <span className="font-semibold text-ink">{lead.name}</span> },
              { header: "Serviço", cell: (lead) => lead.service },
              { header: "Origem", cell: (lead) => lead.source },
              ...(isSuperAdmin ? [{ header: "Franquia", cell: (lead: LeadSummary) => lead.franchiseName }] : []),
              { header: "Status", cell: (lead) => <StatusBadge status={lead.status} /> }
            ]}
          />
        ) : !leadsError ? (
          <EmptyState icon={MessageCircle} title="Nenhum atendimento recente" description="Ainda não há dados para exibir." />
        ) : null}
      </section>
    </AppShell>
  );
}
