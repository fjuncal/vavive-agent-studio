"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getAgents, type AgentSummary } from "@/lib/api";
import { FileText, GitBranch, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const [agent, setAgent] = useState<AgentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAgents()
      .then((items) => {
        const current = items.find((item) => item.id === params?.id) ?? null;
        setAgent(current);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o agente.");
      });
  }, [params?.id]);

  return (
    <AppShell>
      <PageHeader eyebrow="Agente" title={agent?.name ?? "Carregando agente"} description={agent ? `Agente GPTMaker associado a ${agent.franchiseName}.` : "Buscando dados do agente no backend."} />
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Treinamentos" value="Historico" hint="Dados reais salvos no backend" icon={FileText} />
        <StatCard label="Intencoes" value="Em preparo" hint="Configuracao demonstrativa" icon={GitBranch} />
        <StatCard label="Regras" value="Em preparo" hint="Configuracao demonstrativa" icon={ShieldCheck} />
      </section>
      <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-lg font-semibold text-ink">Configuracao atual</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">ID externo: {agent?.externalId ?? "-"}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Tom de voz: {agent?.toneOfVoice ?? "-"}</p>
          </div>
          <StatusBadge status={agent?.status ?? "ATIVO"} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href={`/agentes/${params?.id}/treinamentos`} className="rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white">Treinamentos</Link>
          <Link href={`/agentes/${params?.id}/intencoes`} className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700">Intencoes</Link>
          <Link href={`/agentes/${params?.id}/regras`} className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700">Regras</Link>
        </div>
      </section>
    </AppShell>
  );
}
