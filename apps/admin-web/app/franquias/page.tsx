"use client";

import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { getFranchises, getWorkspaceMapping, type FranchiseSummary, type WorkspaceMapping } from "@/lib/api";
import {
  Building2,
  Link2,
  PlugZap,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
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

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 px-5 py-4 text-sm text-rose-700 dark:text-rose-400 animate-in flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      {isSuperAdmin && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 stagger-children">
          <StatCard
            label="Franquias ativas"
            value={activeCount}
            description="Com workspace e agente conectados."
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            label="Sem agente"
            value={withoutAgentCount}
            description="Workspace conectada, agente pendente."
            icon={Building2}
            variant="warning"
          />
          <StatCard
            label="Pendentes"
            value={pendingCount}
            description="Aguardando configuração da matriz."
            icon={Clock}
            variant="warning"
          />
          <StatCard
            label="Conexões disponíveis"
            value={unlinkedWorkspaceCount}
            description={isLoadingMapping ? "Carregando..." : "Disponíveis para vincular."}
            icon={PlugZap}
          />
        </section>
      )}

      {/* Connection Issues */}
      {isSuperAdmin && (
        <section className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
            <div>
              <p className="section-title">Conexão</p>
              <h2 className="section-subtitle">Pendências de conexão</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Gerencie franquias sem integração e integrações disponíveis.</p>
            </div>
            {mappingError && (
              <span className="badge-danger">Falha ao carregar</span>
            )}
          </div>

          {mappingError && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-400 mb-5">
              {mappingError}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Franchises without integration */}
            <div className="rounded-2xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
              <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                <AlertCircle size={16} className="text-amber-500" />
                Franquias sem integração
              </h3>
              <div className="mt-3 grid gap-3">
                {mapping?.franchisesWithoutWorkspace.length ? mapping.franchisesWithoutWorkspace.map((item) => (
                  <div key={item.franchiseId} className="flex flex-col gap-3 rounded-xl card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.franchiseName}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{item.city} / {item.state}</p>
                    </div>
                    <Link
                      href={`/franquias/${item.franchiseId}`}
                      className="btn-primary py-2 px-3 text-xs"
                    >
                      <Link2 size={14} />
                      Vincular
                    </Link>
                  </div>
                )) : (
                  <div className="rounded-xl card p-4 text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
                    Nenhuma franquia pendente de integração.
                  </div>
                )}
              </div>
            </div>

            {/* Available integrations */}
            <div className="rounded-2xl p-4" style={{ background: "var(--color-bg-secondary)" }}>
              <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                <PlugZap size={16} className="text-brand-600" />
                Integrações disponíveis
              </h3>
              <div className="mt-3 grid gap-3">
                {mapping?.unlinkedWorkspaces.length ? mapping.unlinkedWorkspaces.map((workspace) => (
                  <div key={workspace.workspaceId} className="flex flex-col gap-3 rounded-xl card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{workspace.workspaceName || "Integração"}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Disponível para vincular.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/franquias/nova?workspaceId=${encodeURIComponent(workspace.workspaceId)}`}
                        className="btn-primary py-2 px-3 text-xs"
                      >
                        <Plus size={14} />
                        Criar franquia
                      </Link>
                      <Link
                        href="/franquias"
                        className="btn-secondary py-2 px-3 text-xs"
                      >
                        Vincular existente
                      </Link>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-xl card p-4 text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
                    Nenhuma integração disponível.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pending notice for franchise admin */}
      {!isSuperAdmin && franchises[0]?.status === "PENDENTE_CONFIGURACAO" && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 px-5 py-4 text-sm text-amber-700 dark:text-amber-400 animate-in flex items-center gap-2">
          <Clock size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
          Sua franquia ainda não está ativa. Aguarde a configuração pela matriz.
        </div>
      )}

      {/* Table */}
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
              cell: (franchise) => (
                <span style={{ color: "var(--color-text-secondary)" }}>{franchise.city} / {franchise.state}</span>
              )
            },
            ...(isSuperAdmin ? [{
              header: "Conexão",
              cell: (franchise: FranchiseSummary) => (
                <span style={{ color: franchise.workspaceName ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                  {franchise.workspaceName ?? "Sem integração"}
                </span>
              )
            }] : []),
            {
              header: "Agente",
              cell: (franchise) => (
                <span style={{ color: franchise.agentName ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                  {franchise.agentName ?? "Sem agente"}
                </span>
              )
            },
            {
              header: "Status",
              cell: (franchise) => <StatusBadge status={franchise.status} />
            },
            {
              header: "Ação",
              className: "text-right",
              cell: (franchise) => (
                <Link
                  href={franchise.agentId ? `/franquias/${franchise.id}` : franchise.workspaceId ? `/franquias/${franchise.id}/agente` : `/franquias/${franchise.id}`}
                  className="btn-primary py-2 px-3 text-xs inline-flex"
                >
                  {franchise.agentId ? "Abrir" : franchise.workspaceId ? "Configurar agente" : "Configurar"}
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
          description="Ainda não há dados reais para exibir."
          action={isSuperAdmin ? { label: "Criar primeira franquia", href: "/franquias/nova" } : undefined}
        />
      )}

      {/* Empty mapping state */}
      {isSuperAdmin && mapping && !mapping.linked.length && !mapping.unlinkedWorkspaces.length && !mapping.franchisesWithoutWorkspace.length && (
        <EmptyState
          icon={PlugZap}
          title="Nenhuma conexão encontrada"
          description="Quando houver integrações disponíveis, aparecerão aqui."
        />
      )}
    </AppShell>
  );
}
