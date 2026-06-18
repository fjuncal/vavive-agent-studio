"use client";

import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { formatCreditsStatus, getCreditsNumbers } from "@/lib/credits";
import { getFranchises, getWorkspaceMapping, type FranchiseSummary, type WorkspaceMapping } from "@/lib/api";
import { Building2, Link2, PlugZap, Plus, ArrowRight, CheckCircle2, AlertCircle, Clock, Coins } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function StatCard({ label, value, description, icon: Icon, variant = "default" }: {
  label: string;
  value: number;
  description: string;
  icon: typeof Building2;
  variant?: "default" | "success" | "warning";
}) {
  const variantStyles = {
    default: "",
    success: "bg-emerald-50 dark:bg-emerald-900/30",
    warning: "bg-amber-50 dark:bg-amber-900/30"
  };
  const iconStyles = {
    default: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400",
    success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
  };

  return (
    <article className={`card group ${variantStyles[variant]}`} {...(variant === "default" ? { style: { background: "var(--color-bg-secondary)" } } : {})}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] truncate" style={{ color: "var(--color-text-tertiary)" }}>{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconStyles[variant]} transition-transform duration-200 group-hover:scale-110`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
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
        setMappingError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o mapa de workspaces.");
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
        description={isSuperAdmin ? "Gerencie unidades, saldo e configuracao do Assistente Vavive." : "Acompanhe o status da sua franquia."}
        actionLabel={isSuperAdmin ? "Nova franquia" : undefined}
        actionHref={isSuperAdmin ? "/franquias/nova" : undefined}
      />

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 px-5 py-4 text-sm text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}

      {isSuperAdmin && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Franquias ativas" value={activeCount} description="Com workspace e assistente conectados." icon={CheckCircle2} variant="success" />
          <StatCard label="Sem assistente" value={withoutAgentCount} description="Workspace conectado, assistente pendente." icon={Building2} variant="warning" />
          <StatCard label="Pendentes" value={pendingCount} description="Aguardando configuracao da matriz." icon={Clock} variant="warning" />
          <StatCard label="Workspaces livres" value={unlinkedWorkspaceCount} description={isLoadingMapping ? "Carregando..." : "Disponiveis para vincular."} icon={PlugZap} />
        </section>
      )}

      {isSuperAdmin && (
        <section className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
            <div>
              <p className="section-title">Conexao</p>
              <h2 className="section-subtitle">Pendencias de operacao</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Gerencie franquias sem workspace e workspaces ainda livres.</p>
            </div>
            {mappingError && <span className="badge-danger">Falha ao carregar</span>}
          </div>

          {mappingError && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-400 mb-5">
              {mappingError}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
              <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                <AlertCircle size={16} className="text-amber-500" />
                Franquias sem workspace
              </h3>
              <div className="mt-3 grid gap-3">
                {mapping?.franchisesWithoutWorkspace.length ? mapping.franchisesWithoutWorkspace.map((item) => (
                  <div key={item.franchiseId} className="flex flex-col gap-3 rounded-xl card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.franchiseName}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{item.city} / {item.state}</p>
                    </div>
                    <Link href={`/franquias/${item.franchiseId}`} className="btn-primary py-2 px-3 text-xs">
                      <Link2 size={14} />
                      Vincular
                    </Link>
                  </div>
                )) : (
                  <div className="rounded-xl card p-4 text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
                    Nenhuma franquia pendente de workspace.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
              <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                <PlugZap size={16} className="text-brand-600" />
                Workspaces disponiveis
              </h3>
              <div className="mt-3 grid gap-3">
                {mapping?.unlinkedWorkspaces.length ? mapping.unlinkedWorkspaces.map((workspace) => (
                  <div key={workspace.workspaceId} className="flex flex-col gap-3 rounded-xl card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{workspace.workspaceName || "Workspace"}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Disponivel para vincular.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/franquias/nova?workspaceId=${encodeURIComponent(workspace.workspaceId)}`} className="btn-primary py-2 px-3 text-xs">
                        <Plus size={14} />
                        Criar franquia
                      </Link>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-xl card p-4 text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
                    Nenhum workspace livre.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {!isSuperAdmin && franchises[0]?.status === "PENDENTE_CONFIGURACAO" && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
          Sua franquia ainda nao esta ativa. Aguarde a configuracao pela matriz.
        </div>
      )}

      {franchises.length ? (
        <DataTable
          rows={franchises}
          columns={[
            {
              header: "Franquia",
              cell: (franchise) => (
                <Link className="font-semibold hover:text-brand-700 transition-colors" style={{ color: "var(--color-text-primary)" }} href={`/franquias/${franchise.id}`}>
                  {franchise.name}
                </Link>
              )
            },
            {
              header: "Cidade",
              cell: (franchise) => <span style={{ color: "var(--color-text-secondary)" }}>{franchise.city} / {franchise.state}</span>
            },
            ...(isSuperAdmin ? [{
              header: "Workspace",
              cell: (franchise: FranchiseSummary) => (
                <span style={{ color: franchise.workspaceName ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                  {franchise.workspaceName ?? "Sem workspace"}
                </span>
              )
            }, {
              header: "Saldo",
              cell: (franchise: FranchiseSummary) => {
                const numbers = getCreditsNumbers(franchise.workspaceCredits);
                return (
                  <div className="inline-flex items-center gap-2 text-sm">
                    <Coins size={14} style={{ color: "var(--color-text-tertiary)" }} />
                    <span style={{ color: "var(--color-text-primary)" }}>{numbers.remaining.toLocaleString()}</span>
                    <span style={{ color: "var(--color-text-tertiary)" }}>({formatCreditsStatus(franchise.workspaceCredits?.status)})</span>
                  </div>
                );
              }
            }] : []),
            {
              header: "Assistente",
              cell: (franchise) => (
                <span style={{ color: franchise.agentName ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                  {franchise.agentName ?? "Sem assistente"}
                </span>
              )
            },
            {
              header: "Status",
              cell: (franchise) => <StatusBadge status={franchise.status} />
            },
            {
              header: "Acao",
              className: "text-right",
              cell: (franchise) => (
                <Link
                  href={franchise.agentId ? `/franquias/${franchise.id}` : franchise.workspaceId ? `/franquias/${franchise.id}/agente` : `/franquias/${franchise.id}`}
                  className="btn-primary py-2 px-3 text-xs inline-flex"
                >
                  {franchise.agentId ? "Abrir" : franchise.workspaceId ? "Configurar assistente" : "Configurar"}
                  <ArrowRight size={14} />
                </Link>
              )
            }
          ]}
        />
      ) : (
        <EmptyState
          icon={Building2}
          title="Nenhuma franquia cadastrada"
          description="Ainda nao ha dados reais para exibir."
          action={isSuperAdmin ? { label: "Criar primeira franquia", href: "/franquias/nova" } : undefined}
        />
      )}
    </AppShell>
  );
}
