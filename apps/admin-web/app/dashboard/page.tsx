"use client";

import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getDashboardSummary, getLeads, type DashboardSummary, type LeadSummary } from "@/lib/api";
import { evolution } from "@/lib/mock-data";
import { BadgeCheck, MessageCircle, TrendingUp, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardSummary(), getLeads()])
      .then(([dashboardData, leadsData]) => {
        setSummary(dashboardData);
        setRecentLeads(leadsData.slice(0, 4));
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
          <h2 className="mt-4 text-xl font-semibold">Treinamento da franquia</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Complete dados de servicos, regioes e regras antes de enviar novos blocos ao GPTMaker.
          </p>
          <div className="mt-6 h-2 rounded-full bg-white/10">
            <div className="h-2 w-2/3 rounded-full bg-brand-500" />
          </div>
          <p className="mt-3 text-xs text-white/60">6 de 9 etapas completas</p>
        </div>
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
