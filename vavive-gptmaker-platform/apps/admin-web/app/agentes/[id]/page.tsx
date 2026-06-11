import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { agents } from "@/lib/mock-data";
import { FileText, GitBranch, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agents.find((item) => item.id === id) ?? agents[0];

  return (
    <AppShell>
      <PageHeader eyebrow="Agente" title={agent.name} description={`Agente GPTMaker associado a ${agent.franchise}.`} />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Treinamentos" value="8" hint="Blocos enviados ou salvos" icon={FileText} />
        <StatCard label="Intencoes" value="5" hint="Fluxos comerciais" icon={GitBranch} />
        <StatCard label="Regras" value="6" hint="Guardrails operacionais" icon={ShieldCheck} />
        <StatCard label="Conversas" value="71" hint="Mock do GPTMaker futuro" icon={MessageCircle} />
      </section>
      <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-lg font-semibold text-ink">Configuracao atual</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">ID externo: {agent.externalId}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Tom de voz: {agent.tone}</p>
          </div>
          <StatusBadge status={agent.status} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href={`/agentes/${agent.id}/treinamentos`} className="rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white">Treinamentos</Link>
          <Link href={`/agentes/${agent.id}/intencoes`} className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700">Intencoes</Link>
          <Link href={`/agentes/${agent.id}/regras`} className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700">Regras</Link>
        </div>
      </section>
    </AppShell>
  );
}
