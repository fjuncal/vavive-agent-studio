"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { getAgents, getFranchises, type AgentSummary, type FranchiseSummary } from "@/lib/api";
import { Bot, Building2, ExternalLink, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function statusFor(franchise: FranchiseSummary) {
  if (!franchise.workspaceId) {
    return "PENDENTE_CONFIGURACAO";
  }
  if (!franchise.agentId) {
    return "SEM_AGENTE";
  }
  return franchise.status || "ATIVA";
}

function FranchiseCard({ franchise, agent, isSuperAdmin }: { franchise: FranchiseSummary; agent?: AgentSummary; isSuperAdmin: boolean }) {
  const status = statusFor(franchise);
  const agentCount = agent ? 1 : 0;

  return (
    <article className="card-interactive group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          {agent?.avatar ? (
            <img src={agent.avatar} alt={agent.name} className="h-12 w-12 rounded-2xl object-cover ring-1" style={{ borderColor: "var(--color-border)" }} />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 transition-transform duration-200 group-hover:scale-110">
              <Building2 size={22} />
            </div>
          )}
          <div>
            <h2 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{franchise.name}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{franchise.city} / {franchise.state}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-4 rounded-xl p-4 text-sm" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
        <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>
          <Bot size={16} className="text-brand-600 dark:text-brand-400" />
          Agente
        </div>
        <p className="mt-1">{agent?.name ?? franchise.agentName ?? "Não configurado"}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
          {agentCount} {agentCount === 1 ? "agente" : "agentes"}
        </span>
        <Link
          href={franchise.agentId ? `/franquias/${franchise.id}/agente` : `/franquias/${franchise.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {franchise.agentId ? "Abrir agente" : "Configurar"}
          <ArrowRight size={14} />
        </Link>
      </div>

      {!isSuperAdmin && franchise.status === "PENDENTE_CONFIGURACAO" && (
        <p className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-400">
          Aguardando configuração.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={franchise.agentId ? `/franquias/${franchise.id}/agente` : `/franquias/${franchise.id}`}
          className="btn-primary py-2 px-4 text-xs"
        >
          {franchise.agentId ? "Abrir agente" : "Configurar agente"}
        </Link>
        {franchise.agentId && (
          <Link
            href={`/franquias/${franchise.id}`}
            className="btn-secondary py-2 px-4 text-xs"
          >
            <ExternalLink size={14} />
            Franquia
          </Link>
        )}
      </div>
    </article>
  );
}

export default function AgentsPage() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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

  const filteredFranchises = useMemo(() => {
    const list = isSuperAdmin
      ? franchises
      : franchises.filter((f) => f.id === user?.franchise?.id);

    if (!search.trim()) return list;

    const query = search.toLowerCase();
    return list.filter((f) =>
      f.name.toLowerCase().includes(query) ||
      f.city.toLowerCase().includes(query)
    );
  }, [franchises, isSuperAdmin, user, search]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Agentes"
        title={isSuperAdmin ? "Franquias e agentes" : "Meu agente"}
        description={isSuperAdmin ? "Visualize e gerencie os agentes de cada franquia." : "Acompanhe o agente da sua franquia."}
      />

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 px-5 py-4 text-sm text-rose-700 dark:text-rose-400 animate-in flex items-center gap-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">!</span>
          </div>
          {error}
        </div>
      )}

      {isSuperAdmin && franchises.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-primary)" }}>
          <Search size={17} style={{ color: "var(--color-text-tertiary)" }} />
          <input
            type="text"
            placeholder="Buscar franquia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>
      )}

      {filteredFranchises.length ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {filteredFranchises.map((franchise) => {
            const agent = agents.find((item) => item.franchiseId === franchise.id);
            return (
              <FranchiseCard
                key={franchise.id}
                franchise={franchise}
                agent={agent}
                isSuperAdmin={isSuperAdmin}
              />
            );
          })}
        </section>
      ) : (
        <EmptyState
          icon={Bot}
          title={search ? "Nenhuma franquia encontrada" : "Nenhum agente encontrado"}
          description={search ? "Tente buscar com outros termos." : "Ainda não há dados para exibir."}
        />
      )}
    </AppShell>
  );
}
