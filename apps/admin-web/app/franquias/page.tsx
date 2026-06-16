"use client";

import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { getFranchises, getWorkspaceMapping, type FranchiseSummary, type WorkspaceMapping } from "@/lib/api";
import { Building2, Link2, PlugZap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function StatCard({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <article className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </article>
  );
}

export default function FranchisesPage() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [mapping, setMapping] = useState<WorkspaceMapping | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [isLoadingMapping, setIsLoadingMapping] = useState(false);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    getFranchises()
      .then(setFranchises)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as franquias.");
      });
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }

    setIsLoadingMapping(true);
    setMappingError(null);
    getWorkspaceMapping()
      .then(setMapping)
      .catch((requestError) => {
        setMappingError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o mapa GPTMaker.");
      })
      .finally(() => setIsLoadingMapping(false));
  }, [isSuperAdmin]);

  const activeCount = useMemo(() => franchises.filter((franchise) => franchise.status === "ATIVA").length, [franchises]);
  const withoutAgentCount = useMemo(() => franchises.filter((franchise) => franchise.status === "SEM_AGENTE").length, [franchises]);
  const pendingCount = useMemo(() => franchises.filter((franchise) => franchise.status === "PENDENTE_CONFIGURACAO").length, [franchises]);
  const unlinkedWorkspaceCount = mapping?.unlinkedWorkspaces.length ?? 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Rede"
        title="Franquias"
        description={isSuperAdmin ? "Gerencie unidades, conexões e agentes." : "Acompanhe o status da sua franquia."}
        actionLabel={isSuperAdmin ? "Nova franquia" : undefined}
        actionHref={isSuperAdmin ? "/franquias/nova" : undefined}
      />
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      {isSuperAdmin ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Franquias ativas" value={activeCount} description="Com workspace e agente conectados." />
          <StatCard label="Franquias sem agente" value={withoutAgentCount} description="Workspace conectada, agente pendente." />
          <StatCard label="Franquias pendentes" value={pendingCount} description="Aguardando configuracao da matriz." />
          <StatCard label="Conexões disponíveis" value={unlinkedWorkspaceCount} description={isLoadingMapping ? "Carregando..." : "Disponíveis para vincular."} />
        </section>
      ) : null}

      {isSuperAdmin ? (
        <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Conexão</p>
              <h2 className="mt-2 text-lg font-semibold text-ink">Pendências de conexão</h2>
              <p className="mt-2 text-sm text-slate-500">Gerencie franquias sem integração e integrações disponíveis.</p>
            </div>
            {mappingError ? <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Falha ao carregar</span> : null}
          </div>
          {mappingError ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{mappingError}</p> : null}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="font-semibold text-ink">Franquias sem integração</h3>
              <div className="mt-3 grid gap-3">
                {mapping?.franchisesWithoutWorkspace.length ? mapping.franchisesWithoutWorkspace.map((item) => (
                  <div key={item.franchiseId} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{item.franchiseName}</p>
                      <p className="text-sm text-slate-500">{item.city} / {item.state}</p>
                    </div>
                    <Link href={`/franquias/${item.franchiseId}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white">
                      <Link2 size={14} />
                        Vincular
                    </Link>
                  </div>
                )) : (
                  <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Nenhuma franquia pendente de integração.</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="font-semibold text-ink">Integrações disponíveis</h3>
              <div className="mt-3 grid gap-3">
                {mapping?.unlinkedWorkspaces.length ? mapping.unlinkedWorkspaces.map((workspace) => (
                  <div key={workspace.workspaceId} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{workspace.workspaceName || "Integração"}</p>
                      <p className="text-sm text-slate-500">Disponível.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/franquias/nova?workspaceId=${encodeURIComponent(workspace.workspaceId)}`} className="rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white">
                        Criar franquia
                      </Link>
                      <Link href="/franquias" className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-line">
                        Linkar existente
                      </Link>
                    </div>
                  </div>
                )) : (
                  <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Nenhuma integração disponível.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {!isSuperAdmin && franchises[0]?.status === "PENDENTE_CONFIGURACAO" ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Sua franquia ainda nao esta ativa. Aguarde a configuracao pela matriz.</p>
      ) : null}

      {franchises.length ? (
        <DataTable
          rows={franchises}
          columns={[
            { header: "Franquia", cell: (franchise) => <Link className="font-semibold text-ink hover:text-brand-700" href={`/franquias/${franchise.id}`}>{franchise.name}</Link> },
            { header: "Cidade", cell: (franchise) => `${franchise.city} / ${franchise.state}` },
            ...(isSuperAdmin ? [{ header: "Conexão", cell: (franchise: FranchiseSummary) => franchise.workspaceName ?? "Sem integração" }] : []),
            { header: "Agente", cell: (franchise) => franchise.agentName ?? "Sem agente" },
            { header: "Status", cell: (franchise) => <StatusBadge status={franchise.status} /> },
            {
              header: "Acao",
              cell: (franchise) => (
                <Link href={franchise.agentId ? `/franquias/${franchise.id}` : franchise.workspaceId ? `/franquias/${franchise.id}/agente` : `/franquias/${franchise.id}`} className="inline-flex rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white">
                  {franchise.agentId ? "Abrir" : franchise.workspaceId ? "Configurar agente" : "Configurar"}
                </Link>
              )
            }
          ]}
        />
      ) : (
        <EmptyState icon={Building2} title="Nenhuma franquia cadastrada" description="Ainda nao ha dados reais para exibir." />
      )}

      {isSuperAdmin && mapping && !mapping.linked.length && !mapping.unlinkedWorkspaces.length && !mapping.franchisesWithoutWorkspace.length ? (
        <EmptyState icon={PlugZap} title="Nenhuma conexão encontrada" description="Quando houver integrações disponíveis, aparecerão aqui." />
      ) : null}
    </AppShell>
  );
}
