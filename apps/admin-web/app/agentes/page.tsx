"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { getAgents, getFranchises, type AgentSummary, type FranchiseSummary } from "@/lib/api";
import { Bot, Building2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function statusFor(franchise: FranchiseSummary) {
  if (!franchise.workspaceId) {
    return "PENDENTE_CONFIGURACAO";
  }
  if (!franchise.agentId) {
    return "SEM_AGENTE";
  }
  return franchise.status || "ATIVA";
}

export default function AgentsPage() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    Promise.allSettled([getFranchises(), getAgents()])
      .then(([franchiseResult, agentResult]) => {
        if (franchiseResult.status === "fulfilled") {
          setFranchises(franchiseResult.value);
        } else {
          throw franchiseResult.reason;
        }
        if (agentResult.status === "fulfilled") {
          setAgents(agentResult.value);
        }
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar.");
      });
  }, []);

  const franchiseList = isSuperAdmin
    ? franchises
    : franchises.filter((f) => f.id === user?.franchise?.id);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Agentes"
        title={isSuperAdmin ? "Franquias e agentes" : "Meu agente"}
        description={isSuperAdmin ? "Acompanhe o agente de cada franquia." : "Acompanhe o agente da sua franquia."}
      />
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {franchiseList.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {franchiseList.map((franchise) => {
            const agent = agents.find((item) => item.franchiseId === franchise.id);
            return (
              <article key={franchise.id} className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    {agent?.avatar ? (
                      <img src={agent.avatar} alt={agent.name} className="h-12 w-12 rounded-2xl object-cover ring-1 ring-line" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                        <Building2 size={22} />
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold text-ink">{franchise.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{franchise.city} / {franchise.state}</p>
                    </div>
                  </div>
                  <StatusBadge status={statusFor(franchise)} />
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2 font-semibold text-ink">
                    <Bot size={16} />
                    Agente
                  </div>
                  <p className="mt-1">{agent?.name ?? franchise.agentName ?? "Não configurado"}</p>
                </div>

                {!isSuperAdmin && franchise.status === "PENDENTE_CONFIGURACAO" ? (
                  <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Aguardando configuração.</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/franquias/${franchise.id}/agente`} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">
                    {franchise.agentId ? "Abrir agente" : "Configurar agente"}
                  </Link>
                  {franchise.agentId ? (
                    <Link href={`/franquias/${franchise.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">
                      <ExternalLink size={16} />
                      Franquia
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState icon={Bot} title="Nenhum agente encontrado" description="Ainda não há dados para exibir." />
      )}
    </AppShell>
  );
}
