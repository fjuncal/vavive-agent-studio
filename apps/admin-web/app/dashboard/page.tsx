"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  getDashboardSummary,
  getFranchises,
  type DashboardSummary,
  type FranchiseSummary
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  Bot,
  Building2,
  MessageCircle,
  Radio,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function formatDate(value?: string | null) {
  if (!value) {
    return "Sem sincronização";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function QuickAction({ icon: Icon, label, href, description }: {
  icon: typeof Building2;
  label: string;
  href: string;
  description: string;
}) {
  return (
    <Link href={href} className="card-interactive flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-transform duration-200 group-hover:scale-110">
        <Icon size={22} />
      </div>
      <div>
        <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{label}</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setError(null);
    getDashboardSummary()
      .then(setSummary)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o dashboard."));

    if (isSuperAdmin) {
      getFranchises().then(setFranchises).catch(() => setFranchises([]));
    } else {
      setFranchises(user.franchise ? [user.franchise] : []);
    }
  }, [isSuperAdmin, user]);

  const blockedFranchises = useMemo(
    () => franchises.filter((item) => item.status === "PENDENTE_CONFIGURACAO").slice(0, 4),
    [franchises]
  );
  const readyFranchises = useMemo(
    () => franchises.filter((item) => item.status === "ATIVA").slice(0, 4),
    [franchises]
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operação"
        title="Dashboard operacional"
        description={isSuperAdmin ? "Visão completa da rede, bloqueios e prontidão." : "Status da sua franquia, canais e atendimento."}
      />

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 px-5 py-4 text-sm text-rose-700 dark:text-rose-400 animate-in flex items-center gap-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-800">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">!</span>
          </div>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger-children">
        <StatCard
          label={isSuperAdmin ? "Franquias bloqueadas" : "Progresso do setup"}
          value={String(isSuperAdmin ? summary?.blockedFranchises ?? 0 : `${summary?.completionPercentage ?? 0}%`)}
          hint={isSuperAdmin ? "Sem workspace ou sem setup" : summary?.setupStatus?.replaceAll("_", " ") ?? "Não iniciado"}
          icon={ShieldAlert}
          variant={isSuperAdmin && (summary?.blockedFranchises ?? 0) > 0 ? "warning" : "default"}
        />
        <StatCard
          label={isSuperAdmin ? "Sem agente" : "Conversas humanas"}
          value={String(isSuperAdmin ? summary?.franchisesWithoutAgent ?? 0 : summary?.waitingHumanConversations ?? 0)}
          hint={isSuperAdmin ? "Franquias pendentes de agente" : "Fila manual em aberto"}
          icon={Bot}
          variant={!isSuperAdmin && (summary?.waitingHumanConversations ?? 0) > 0 ? "warning" : "default"}
        />
        <StatCard
          label={isSuperAdmin ? "Prontas para publicar" : "Canais sincronizados"}
          value={String(isSuperAdmin ? summary?.franchisesReadyToPublish ?? 0 : summary?.syncedChannels ?? 0)}
          hint={isSuperAdmin ? "Setup completo aguardando publicação" : "Canais com último sync válido"}
          icon={Sparkles}
          variant="success"
        />
        <StatCard
          label="Última sincronização"
          value={formatDate(summary?.lastNetworkActionAt)}
          hint={`${summary?.waitingHumanConversations ?? 0} conversas aguardando`}
          icon={Activity}
        />
      </section>

      {/* Quick Actions */}
      {isSuperAdmin && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          <QuickAction
            icon={Building2}
            label="Nova franquia"
            href="/franquias/nova"
            description="Cadastrar uma nova unidade na rede."
          />
          <QuickAction
            icon={Bot}
            label="Configurar agente"
            href="/setup-guiado"
            description="Treinar e publicar agente de atendimento."
          />
          <QuickAction
            icon={MessageCircle}
            label="Ver conversas"
            href="/conversas"
            description="Acompanhar atendimentos em tempo real."
          />
        </section>
      )}

      {/* Main Content */}
      <section className="grid gap-6 lg:grid-cols-2 stagger-children">
        {/* Blocked / My Franchise */}
        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{isSuperAdmin ? "Bloqueios da rede" : "Minha franquia"}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{isSuperAdmin ? "Franquias que ainda não podem operar." : "Resumo operacional atual."}</p>
            </div>
            <StatusBadge status={summary?.setupStatus ?? "NAO_INICIADO"} />
          </div>

          {isSuperAdmin ? (
            blockedFranchises.length ? (
              <div className="grid gap-3">
                {blockedFranchises.map((franchise) => (
                  <Link
                    key={franchise.id}
                    href={`/franquias/${franchise.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    style={{ background: "var(--color-bg-secondary)" }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{franchise.name}</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{franchise.city} / {franchise.state}</p>
                    </div>
                    <StatusBadge status={franchise.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Building2}
                title="Sem bloqueios"
                description="Nenhuma franquia bloqueada neste momento."
              />
            )
          ) : (
            <div className="grid gap-3">
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Franquia</p>
                <p className="mt-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>{user?.franchise?.name ?? "Não associada"}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{user?.franchise ? `${user.franchise.city} / ${user.franchise.state}` : "Verifique o cadastro"}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Última publicação</p>
                <p className="mt-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>{formatDate(summary?.lastPublicationAt)}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{summary?.lastTrainingTitle ?? "Nenhum treinamento publicado"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Ready / Queue */}
        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{isSuperAdmin ? "Franquias prontas" : "Fila de atendimento"}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{isSuperAdmin ? "Unidades operando com agente ativo." : "Conversas esperando suporte humano."}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Radio size={18} />
            </div>
          </div>

          {isSuperAdmin ? (
            readyFranchises.length ? (
              <div className="grid gap-3">
                {readyFranchises.map((franchise) => (
                  <Link
                    key={franchise.id}
                    href={`/franquias/${franchise.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    style={{ background: "var(--color-bg-secondary)" }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{franchise.name}</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{franchise.agentName ?? "Agente não informado"}</p>
                    </div>
                    <StatusBadge status={franchise.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="Sem franquias prontas"
                description="Nenhuma unidade pronta para operar ainda."
              />
            )
          ) : (
            <div className="grid gap-3">
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Aguardando humano</p>
                    <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{summary?.waitingHumanConversations ?? 0}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                    <Users size={22} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Canais sincronizados</p>
                    <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{summary?.syncedChannels ?? 0}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Radio size={22} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Health Section */}
      <section className="card stagger-children">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Saúde operacional</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Visão consolidada do que precisa de ação agora.</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl px-4 py-4" style={{ background: "var(--color-bg-secondary)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Atendimentos totais</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{summary?.totalLeads ?? 0}</p>
          </div>
          <div className="rounded-xl px-4 py-4" style={{ background: "var(--color-bg-secondary)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Em atendimento</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{summary?.activeLeads ?? 0}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">Taxa de conversão</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{summary?.conversionRate ?? 0}%</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
