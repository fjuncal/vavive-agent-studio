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
  getFranchiseSetup,
  getGptMakerDiagnostics,
  getGptMakerHealth,
  getLeads,
  type AgentSummary,
  type DashboardSummary,
  type FranchiseSetup,
  type GptMakerDiagnostics,
  type GptMakerHealth,
  type LeadSummary,
  type TrainingSummary
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BadgeCheck, Bot, Building2, FileText, MessageCircle, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatPublication(value?: string | null) {
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
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  const [recentLeads, setRecentLeads] = useState<LeadSummary[]>([]);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [isLeadsLoading, setIsLeadsLoading] = useState(true);

  const [gptMakerHealth, setGptMakerHealth] = useState<GptMakerHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  const [gptMakerDiagnostics, setGptMakerDiagnostics] = useState<GptMakerDiagnostics | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [isDiagnosticsLoading, setIsDiagnosticsLoading] = useState(false);

  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [franchiseSetup, setFranchiseSetup] = useState<FranchiseSetup | null>(null);
  const [franchiseSetupError, setFranchiseSetupError] = useState<string | null>(null);
  const [recentTrainings, setRecentTrainings] = useState<TrainingSummary[]>([]);
  const [trainingsError, setTrainingsError] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const currentAgent = agents[0] ?? null;
  const connectedAgent = useMemo(
    () => agents.find((agent) => agent.connectedToRealGptMaker) ?? currentAgent,
    [agents, currentAgent]
  );

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    setIsSummaryLoading(true);
    setSummaryError(null);
    getDashboardSummary()
      .then(setSummary)
      .catch((requestError) => {
        setSummaryError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o resumo.");
      })
      .finally(() => setIsSummaryLoading(false));

    setIsLeadsLoading(true);
    setLeadsError(null);
    getLeads()
      .then((items) => setRecentLeads(items.slice(0, 4)))
      .catch((requestError) => {
        setLeadsError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os leads.");
      })
      .finally(() => setIsLeadsLoading(false));

    setIsHealthLoading(true);
    setHealthError(null);
    getGptMakerHealth()
      .then(setGptMakerHealth)
      .catch((requestError) => {
        setHealthError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o status da integracao.");
      })
      .finally(() => setIsHealthLoading(false));
  }, [isAuthLoading, user]);

  useEffect(() => {
    if (isAuthLoading || !user || !isSuperAdmin) {
      setGptMakerDiagnostics(null);
      setDiagnosticsError(null);
      setIsDiagnosticsLoading(false);
      return;
    }

    setIsDiagnosticsLoading(true);
    setDiagnosticsError(null);
    getGptMakerDiagnostics()
      .then(setGptMakerDiagnostics)
      .catch((requestError) => {
        setDiagnosticsError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o status detalhado da integracao.");
      })
      .finally(() => setIsDiagnosticsLoading(false));
  }, [isAuthLoading, isSuperAdmin, user]);

  useEffect(() => {
    if (isAuthLoading || !user || user.role !== "ADMIN_FRANQUIA") {
      setAgents([]);
      setAgentsError(null);
      setFranchiseSetup(null);
      setFranchiseSetupError(null);
      setRecentTrainings([]);
      setTrainingsError(null);
      return;
    }

    const franchiseId = user.franchise?.id;
    if (!franchiseId) {
      setFranchiseSetupError("Usuario ADMIN_FRANQUIA nao possui franquia associada.");
      setAgentsError("Usuario ADMIN_FRANQUIA nao possui franquia associada.");
      setTrainingsError("Usuario ADMIN_FRANQUIA nao possui franquia associada.");
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
          setRecentTrainings([]);
          setTrainingsError(null);
          return;
        }

        setTrainingsError(null);
        getAgentTrainings(firstAgent.id)
          .then((trainings) => setRecentTrainings(trainings.slice(0, 3)))
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
        description={
          isSuperAdmin
            ? "Acompanhe a operacao da rede, a saude da integracao GPTMaker e os principais indicadores comerciais."
            : "Acompanhe os indicadores da sua franquia, o status do agente conectado e a evolucao da configuracao da unidade."
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total de leads" value={isSummaryLoading ? "..." : String(summary?.totalLeads ?? 0)} hint={summaryError ?? "Atualizado pelo backend"} icon={UsersRound} />
        <StatCard label="Novos leads" value={isSummaryLoading ? "..." : String(summary?.newLeads ?? 0)} hint={summaryError ?? "Aguardando primeiro contato"} icon={MessageCircle} />
        <StatCard label="Em atendimento" value={isSummaryLoading ? "..." : String(summary?.activeLeads ?? 0)} hint={summaryError ?? "Conversas em andamento"} icon={TrendingUp} />
        <StatCard label="Finalizadas" value={isSummaryLoading ? "..." : String(summary?.finishedChats ?? 0)} hint={summaryError ?? "Atendimentos encerrados"} icon={BadgeCheck} />
        <StatCard label="Conversao" value={isSummaryLoading ? "..." : `${summary?.conversionRate?.toFixed(1).replace(".", ",") ?? "0,0"}%`} hint={summaryError ?? "Calculada a partir dos leads reais"} icon={TrendingUp} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status de configuracao</p>
          <p className="mt-3 text-lg font-semibold text-ink">{isSummaryLoading ? "..." : formatSetupStatus(summary?.setupStatus)}</p>
          {summaryError ? <p className="mt-2 text-sm text-rose-700">{summaryError}</p> : null}
        </div>
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">% concluido</p>
          <p className="mt-3 text-lg font-semibold text-ink">{isSummaryLoading ? "..." : `${summary?.completionPercentage ?? 0}%`}</p>
        </div>
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ultima publicacao</p>
          <p className="mt-3 text-sm font-semibold text-ink">{isSummaryLoading ? "..." : formatPublication(summary?.lastPublicationAt)}</p>
        </div>
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ultimo treinamento</p>
          <p className="mt-3 text-sm font-semibold text-ink">{isSummaryLoading ? "..." : summary?.lastTrainingTitle || "Nenhum treinamento registrado"}</p>
        </div>
      </section>

      {isSuperAdmin ? (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-ink">Historico de evolucao</h2>
                <p className="mt-1 text-sm text-slate-500">Historico de evolucao ainda nao disponivel.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Em preparacao</span>
            </div>
            <div className="mt-6">
              <EmptyState icon={TrendingUp} title="Sem serie historica no backend" description="Os cards acima ja mostram dados reais. O historico consolidado sera integrado nas proximas etapas." />
            </div>
          </div>
          <div className="rounded-2xl border border-line/80 bg-ink p-5 text-white shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-100">Visao geral</p>
            <h2 className="mt-4 text-xl font-semibold">Operacao centralizada</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              O painel principal agora depende dos dados reais do backend. Falhas isoladas da integracao GPTMaker nao interrompem o restante da operacao.
            </p>
            <div className="mt-6 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-brand-500" style={{ width: `${summary?.completionPercentage ?? 0}%` }} />
            </div>
            <p className="mt-3 text-xs text-white/60">
              {isSummaryLoading ? "Carregando progresso..." : `${summary?.completionPercentage ?? 0}% concluido - ${formatSetupStatus(summary?.setupStatus)}`}
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Agente conectado</p>
                <h2 className="mt-2 text-lg font-semibold text-ink">{connectedAgent?.name ?? "Nenhum agente vinculado"}</h2>
              </div>
              <StatusBadge status={connectedAgent?.status ?? "NAO_CONECTADO"} />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {agentsError
                ? agentsError
                : connectedAgent?.connectionStatus ?? "Conecte o agente da franquia para continuar a operacao assistida."}
            </p>
          </div>

          <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-ink">Ultimos treinamentos</h2>
                <p className="mt-1 text-sm text-slate-500">Historico salvo pela API da Vavive.</p>
              </div>
            </div>
            {trainingsError ? <p className="mt-4 text-sm text-rose-700">{trainingsError}</p> : null}
            {recentTrainings.length ? (
              <div className="mt-4 grid gap-3">
                {recentTrainings.map((training) => (
                  <div key={training.id} className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{training.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatPublication(training.createdAt)}</p>
                      </div>
                      <StatusBadge status={training.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Nenhum treinamento salvo para esta franquia.</p>
            )}
          </div>

          <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-ink">Configuracao da franquia</h2>
                <p className="mt-1 text-sm text-slate-500">Resumo operacional da unidade.</p>
              </div>
            </div>
            {franchiseSetupError ? <p className="mt-4 text-sm text-rose-700">{franchiseSetupError}</p> : null}
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Responsavel</p>
                <p className="mt-2 text-sm font-semibold text-ink">{franchiseSetup?.responsibleName || "Nao informado"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</p>
                <p className="mt-2 text-sm font-semibold text-ink">{formatSetupStatus(franchiseSetup?.setupStatus)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Conclusao</p>
                <p className="mt-2 text-sm font-semibold text-ink">{franchiseSetup?.completionPercentage ?? 0}%</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Integracao</p>
            <h2 className="mt-2 text-lg font-semibold text-ink">Status da integracao GPTMaker</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              A plataforma publica via backend da Vavive. O painel mostra apenas o estado necessario para operar com seguranca.
            </p>
          </div>
          <StatusBadge status={gptMakerHealth?.status ?? "MOCK"} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Ambiente</p>
            <p className="mt-2 text-sm font-semibold text-ink">{gptMakerHealth?.mockEnabled ? "Ambiente de desenvolvimento" : "Integracao ativa"}</p>
          </div>
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</p>
            <p className="mt-2 text-sm font-semibold text-ink">{isHealthLoading ? "Carregando..." : gptMakerHealth?.status ?? "Indisponivel"}</p>
          </div>
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Uso no painel</p>
            <p className="mt-2 text-sm font-semibold text-ink">{isSuperAdmin ? "Visao geral da rede" : "Uso da sua franquia"}</p>
          </div>
        </div>
        <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${healthError ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"}`}>
          {healthError ?? gptMakerHealth?.message ?? "Carregando status da integracao GPTMaker..."}
        </p>
        {isSuperAdmin && gptMakerHealth ? (
          <details className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <summary className="cursor-pointer font-semibold text-ink">Detalhes tecnicos</summary>
            <div className="mt-3 grid gap-2">
              <p>Base configurada: {gptMakerHealth.baseUrl}</p>
              <p>Token configurado: {gptMakerHealth.tokenConfigured ? "Sim" : "Nao"}</p>
            </div>
          </details>
        ) : null}
      </section>

      {isSuperAdmin ? (
        <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Integracao</p>
              <h2 className="mt-2 text-lg font-semibold text-ink">Status da integracao</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Esta visao detalhada fica restrita ao SUPER_ADMIN para apoiar validacoes do ambiente sem poluir a interface principal.
              </p>
            </div>
            <StatusBadge status={gptMakerDiagnostics?.status ?? "MOCK"} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-mist px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Ambiente</p>
              <p className="mt-2 text-sm font-semibold text-ink">{gptMakerDiagnostics?.mockEnabled ? "Ambiente de desenvolvimento" : "Integracao ativa"}</p>
            </div>
            <div className="rounded-xl bg-mist px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Workspaces</p>
              <p className="mt-2 text-sm font-semibold text-ink">{isDiagnosticsLoading ? "..." : gptMakerDiagnostics?.workspaceCount ?? 0}</p>
            </div>
            <div className="rounded-xl bg-mist px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Token configurado</p>
              <p className="mt-2 text-sm font-semibold text-ink">{gptMakerDiagnostics?.tokenConfigured ? "Sim" : "Nao"}</p>
            </div>
            <div className="rounded-xl bg-mist px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</p>
              <p className="mt-2 text-sm font-semibold text-ink">{isDiagnosticsLoading ? "Carregando..." : gptMakerDiagnostics?.status ?? "Indisponivel"}</p>
            </div>
          </div>
          <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${diagnosticsError ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"}`}>
            {diagnosticsError ?? gptMakerDiagnostics?.message ?? "Carregando status detalhado da integracao..."}
          </p>
          {gptMakerDiagnostics?.details ? (
            <details className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <summary className="cursor-pointer font-semibold text-ink">Detalhes tecnicos</summary>
              <div className="mt-3 grid gap-2">
                <p>{gptMakerDiagnostics.details}</p>
                {gptMakerDiagnostics.httpStatus ? <p>HTTP: {gptMakerDiagnostics.httpStatus}</p> : null}
                {gptMakerDiagnostics.errorCode ? <p>Codigo: {gptMakerDiagnostics.errorCode}</p> : null}
                {gptMakerDiagnostics.endpoint ? <p>Rota consultada: {gptMakerDiagnostics.endpoint}</p> : null}
                {gptMakerDiagnostics.responsePreview ? <p>Retorno resumido: {gptMakerDiagnostics.responsePreview}</p> : null}
              </div>
            </details>
          ) : null}
        </section>
      ) : null}

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
        ) : (
          <EmptyState
            icon={MessageCircle}
            title={isLeadsLoading ? "Carregando leads" : "Nenhum lead recente"}
            description={isLeadsLoading ? "Consultando dados reais do backend." : "Quando houver leads cadastrados, eles aparecerao aqui."}
          />
        )}
      </section>
    </AppShell>
  );
}
