"use client";

import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getDashboardSummary, getGptMakerDiagnostics, getGptMakerHealth, getLeads, type DashboardSummary, type GptMakerDiagnostics, type GptMakerHealth, type LeadSummary } from "@/lib/api";
import { evolution } from "@/lib/mock-data";
import { BadgeCheck, MessageCircle, TrendingUp, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

function formatPublication(value?: string | null) {
  if (!value) {
    return "Ainda nao publicado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [gptMakerHealth, setGptMakerHealth] = useState<GptMakerHealth | null>(null);
  const [gptMakerDiagnostics, setGptMakerDiagnostics] = useState<GptMakerDiagnostics | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardSummary(), getLeads(), getGptMakerHealth(), getGptMakerDiagnostics()])
      .then(([dashboardData, leadsData, gptMakerData, gptMakerDiagnosticsData]) => {
        setSummary(dashboardData);
        setRecentLeads(leadsData.slice(0, 4));
        setGptMakerHealth(gptMakerData);
        setGptMakerDiagnostics(gptMakerDiagnosticsData);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o dashboard.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operacao Vavive"
        title="Dashboard"
        description="Acompanhe a saude comercial das franquias e a atividade inicial dos agentes conectados ao GPTMaker."
      />

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total de leads" value={isLoading ? "..." : String(summary?.totalLeads ?? 0)} hint="+12% nos ultimos 7 dias" icon={UsersRound} />
        <StatCard label="Novos leads" value={isLoading ? "..." : String(summary?.newLeads ?? 0)} hint="Aguardando primeiro contato" icon={MessageCircle} />
        <StatCard label="Em atendimento" value={isLoading ? "..." : String(summary?.activeLeads ?? 0)} hint="Conversas em andamento" icon={TrendingUp} />
        <StatCard label="Finalizadas" value={isLoading ? "..." : String(summary?.finishedChats ?? 0)} hint="Chats encerrados" icon={BadgeCheck} />
        <StatCard label="Conversao" value={isLoading ? "..." : `${summary?.conversionRate?.toFixed(1).replace(".", ",") ?? "0,0"}%`} hint="Calculada a partir do backend" icon={TrendingUp} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status de configuracao</p>
          <p className="mt-3 text-lg font-semibold text-ink">{isLoading ? "..." : summary?.setupStatus?.replaceAll("_", " ") || "NAO INICIADO"}</p>
        </div>
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">% concluido</p>
          <p className="mt-3 text-lg font-semibold text-ink">{isLoading ? "..." : `${summary?.completionPercentage ?? 0}%`}</p>
        </div>
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ultima publicacao</p>
          <p className="mt-3 text-sm font-semibold text-ink">{isLoading ? "..." : formatPublication(summary?.lastPublicationAt)}</p>
        </div>
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ultimo treinamento</p>
          <p className="mt-3 text-sm font-semibold text-ink">{isLoading ? "..." : summary?.lastTrainingTitle || "Nenhum treinamento publicado"}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink">Evolucao de leads</h2>
              <p className="mt-1 text-sm text-slate-500">Grafico ainda mockado neste MVP, enquanto o backend expõe apenas o resumo.</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Semana atual</span>
          </div>
          <div className="mt-8 flex h-64 items-end gap-3">
            {evolution.map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                <div className="w-full rounded-t-2xl bg-gradient-to-t from-brand-600 to-brand-100" style={{ height: `${item.value * 2.4}px` }} />
                <span className="text-xs font-medium text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line/80 bg-ink p-5 text-white shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-100">Proximo melhor passo</p>
          <h2 className="mt-4 text-xl font-semibold">Setup guiado da franquia</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            O fluxo principal agora publica o agente a partir do setup. Complete os campos obrigatorios e gere o treinamento sem sair da jornada.
          </p>
          <div className="mt-6 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${summary?.completionPercentage ?? 0}%` }} />
          </div>
          <p className="mt-3 text-xs text-white/60">
            {isLoading ? "Carregando progresso..." : `${summary?.completionPercentage ?? 0}% concluido • ${summary?.setupStatus?.replaceAll("_", " ") || "NAO INICIADO"}`}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Integracao</p>
            <h2 className="mt-2 text-lg font-semibold text-ink">Status GPTMaker</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              O front nao conversa com o GPTMaker diretamente. Toda publicacao passa pela API da Vavive.
            </p>
          </div>
          <StatusBadge status={gptMakerHealth?.status ?? "MOCK"} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Modo</p>
            <p className="mt-2 text-sm font-semibold text-ink">{gptMakerHealth?.mockEnabled ? "Mock" : "Real"}</p>
          </div>
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Token configurado</p>
            <p className="mt-2 text-sm font-semibold text-ink">{gptMakerHealth?.tokenConfigured ? "Sim" : "Nao"}</p>
          </div>
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Base URL</p>
            <p className="mt-2 break-all text-sm font-semibold text-ink">{gptMakerHealth?.baseUrl ?? "Carregando..."}</p>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {gptMakerHealth?.message ?? "Carregando status da integracao GPTMaker..."}
        </p>
      </section>

      <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Diagnostico</p>
            <h2 className="mt-2 text-lg font-semibold text-ink">Diagnostico GPTMaker</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Este card chama a API real quando o modo mock esta desativado e ajuda a separar erro de configuracao, token ou payload.
            </p>
          </div>
          <StatusBadge status={gptMakerDiagnostics?.status ?? "MOCK"} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Modo</p>
            <p className="mt-2 text-sm font-semibold text-ink">{gptMakerDiagnostics?.mockEnabled ? "Mock" : "Real"}</p>
          </div>
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Token configurado</p>
            <p className="mt-2 text-sm font-semibold text-ink">{gptMakerDiagnostics?.tokenConfigured ? "Sim" : "Nao"}</p>
          </div>
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Workspaces encontrados</p>
            <p className="mt-2 text-sm font-semibold text-ink">{gptMakerDiagnostics?.workspaceCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</p>
            <p className="mt-2 text-sm font-semibold text-ink">{gptMakerDiagnostics?.status ?? "Carregando..."}</p>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {gptMakerDiagnostics?.message ?? "Carregando diagnostico GPTMaker..."}
        </p>
        {gptMakerDiagnostics?.details ? (
          <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {gptMakerDiagnostics.details}
          </p>
        ) : null}
        {gptMakerDiagnostics?.status === "ERROR" ? (
          <div className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {gptMakerDiagnostics.httpStatus ? <p>HTTP: {gptMakerDiagnostics.httpStatus}</p> : null}
            {gptMakerDiagnostics.errorCode ? <p>Codigo: {gptMakerDiagnostics.errorCode}</p> : null}
            {gptMakerDiagnostics.endpoint ? <p>Endpoint: {gptMakerDiagnostics.endpoint}</p> : null}
            {gptMakerDiagnostics.responsePreview ? <p>Resposta: {gptMakerDiagnostics.responsePreview}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-ink">Leads recentes</h2>
        {recentLeads.length ? (
          <DataTable
            rows={recentLeads}
            columns={[
              { header: "Nome", cell: (lead) => <span className="font-semibold text-ink">{lead.name}</span> },
              { header: "Servico", cell: (lead) => lead.service },
              { header: "Origem", cell: (lead) => lead.source },
              { header: "Franquia", cell: (lead) => lead.franchiseName },
              { header: "Status", cell: (lead) => <StatusBadge status={lead.status} /> }
            ]}
          />
        ) : (
          <EmptyState icon={MessageCircle} title="Nenhum lead recente" description="Quando houver leads na base da Vavive, eles aparecerao aqui." />
        )}
      </section>
    </AppShell>
  );
}
