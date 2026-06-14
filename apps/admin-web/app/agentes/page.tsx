"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getAgents, type AgentSummary } from "@/lib/api";
import { Bot, FileText, GitBranch, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAgents()
      .then(setAgents)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os agentes.");
      });
  }, []);

  return (
    <AppShell>
      <PageHeader
        eyebrow="GPTMaker"
        title="Agentes"
        description="A plataforma Vavive organiza agentes e configuracoes. Toda comunicacao real com GPTMaker deve passar pela API Java."
      />
      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Agentes sem conexao real ao GPTMaker devem ser tratados como dados demonstrativos neste MVP.</div>
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {agents.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {agents.map((agent) => (
            <article key={agent.id} className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink">{agent.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{agent.franchiseName}</p>
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </div>
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                {!agent.connectedToRealGptMaker ? <p className="mb-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">Dados demonstrativos</p> : null}
                <p><strong className="text-ink">Conexao GPTMaker:</strong> {agent.connectionStatus}</p>
                <p className="mt-1"><strong className="text-ink">External ID:</strong> {agent.externalId || "Nao configurado"}</p>
                <p><strong className="text-ink">Tom:</strong> {agent.toneOfVoice}</p>
                <p className="mt-1"><strong className="text-ink">Ultima sync:</strong> {new Date(agent.createdAt).toLocaleString("pt-BR")}</p>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-4">
                <Link href={`/agentes/${agent.id}`} className="rounded-xl bg-ink px-3 py-2 text-center text-xs font-semibold text-white">Detalhes</Link>
                <Link href={`/agentes/${agent.id}/treinamentos`} className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"><FileText size={14} /> Treinos</Link>
                <Link href={`/agentes/${agent.id}/intencoes`} className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"><GitBranch size={14} /> Intencoes</Link>
                <Link href={`/agentes/${agent.id}/regras`} className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"><ShieldCheck size={14} /> Regras</Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState icon={Bot} title="Nenhum agente encontrado" description="Quando o backend retornar agentes cadastrados, eles aparecerao aqui. As telas detalhadas continuam mockadas neste MVP." />
      )}
    </AppShell>
  );
}
