"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getDashboardSummary, getFranchises, type DashboardSummary, type FranchiseSummary } from "@/lib/api";
import { formatCreditsStatus, getCreditsNumbers } from "@/lib/credits";
import { useAuth } from "@/lib/auth";
import { Activity, Bot, Building2, Coins, MessageCircle, Radio, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function formatDate(value?: string | null) {
  if (!value) {
    return "Sem sincronizacao";
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
  const credits = summary?.workspaceCredits ?? null;
  const creditNumbers = getCreditsNumbers(credits);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operacao"
        title="Dashboard operacional"
        description={isSuperAdmin ? "Visao da rede, bloqueios e saldo por unidade." : "Status da unidade, saldo operacional e atendimento."}
      />

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 px-5 py-4 text-sm text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isSuperAdmin ? "Franquias bloqueadas" : "Progresso do assistente"}
          value={String(isSuperAdmin ? summary?.blockedFranchises ?? 0 : `${summary?.completionPercentage ?? 0}%`)}
          hint={isSuperAdmin ? "Sem workspace ou sem setup" : summary?.setupStatus?.replaceAll("_", " ") ?? "Nao iniciado"}
          icon={ShieldAlert}
          variant={isSuperAdmin && (summary?.blockedFranchises ?? 0) > 0 ? "warning" : "default"}
        />
        <StatCard
          label={isSuperAdmin ? "Sem assistente" : "Conversas humanas"}
          value={String(isSuperAdmin ? summary?.franchisesWithoutAgent ?? 0 : summary?.waitingHumanConversations ?? 0)}
          hint={isSuperAdmin ? "Unidades pendentes" : "Fila manual em aberto"}
          icon={Bot}
          variant={!isSuperAdmin && (summary?.waitingHumanConversations ?? 0) > 0 ? "warning" : "default"}
        />
        <StatCard
          label={isSuperAdmin ? "Prontas para publicar" : "Canais sincronizados"}
          value={String(isSuperAdmin ? summary?.franchisesReadyToPublish ?? 0 : summary?.syncedChannels ?? 0)}
          hint={isSuperAdmin ? "Setup completo" : "Canais ativos"}
          icon={Sparkles}
          variant="success"
        />
        <StatCard
          label="Ultima sincronizacao"
          value={formatDate(summary?.lastNetworkActionAt)}
          hint={`${summary?.waitingHumanConversations ?? 0} conversas aguardando`}
          icon={Activity}
        />
      </section>

      {!isSuperAdmin && (
        <section className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Saldo operacional</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Estado {formatCreditsStatus(credits?.status)} da unidade.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Coins size={22} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Total</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>{creditNumbers.total.toLocaleString()}</p>
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Usados</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>{creditNumbers.used.toLocaleString()}</p>
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Disponiveis</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>{creditNumbers.remaining.toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {credits?.message ?? "Saldo indisponivel no momento."}
          </p>
        </section>
      )}

      {isSuperAdmin && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction icon={Building2} label="Nova franquia" href="/franquias/nova" description="Cadastrar nova unidade." />
          <QuickAction icon={Bot} label="Padroes do assistente" href="/configuracoes/textos-padrao" description="Definir padroes da matriz por bloco." />
          <QuickAction icon={MessageCircle} label="Ver conversas" href="/conversas" description="Acompanhar atendimentos da rede." />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{isSuperAdmin ? "Bloqueios da rede" : "Minha unidade"}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{isSuperAdmin ? "Franquias que ainda nao podem operar." : "Resumo operacional atual."}</p>
            </div>
            <StatusBadge status={summary?.setupStatus ?? "NAO_INICIADO"} />
          </div>

          {isSuperAdmin ? (
            blockedFranchises.length ? (
              <div className="grid gap-3">
                {blockedFranchises.map((franchise) => (
                  <Link key={franchise.id} href={`/franquias/${franchise.id}`} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{franchise.name}</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{franchise.city} / {franchise.state}</p>
                    </div>
                    <StatusBadge status={franchise.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={Building2} title="Sem bloqueios" description="Nenhuma franquia bloqueada agora." />
            )
          ) : (
            <div className="grid gap-3">
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Franquia</p>
                <p className="mt-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>{user?.franchise?.name ?? "Nao associada"}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{user?.franchise ? `${user.franchise.city} / ${user.franchise.state}` : "Verifique o cadastro"}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Ultima publicacao</p>
                <p className="mt-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>{formatDate(summary?.lastPublicationAt)}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{summary?.lastTrainingTitle ?? "Nenhum treinamento publicado"}</p>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{isSuperAdmin ? "Franquias prontas" : "Fila de atendimento"}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{isSuperAdmin ? "Unidades com assistente ativo." : "Conversas esperando suporte humano."}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Radio size={18} />
            </div>
          </div>

          {isSuperAdmin ? (
            readyFranchises.length ? (
              <div className="grid gap-3">
                {readyFranchises.map((franchise) => (
                  <Link key={franchise.id} href={`/franquias/${franchise.id}`} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{franchise.name}</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{franchise.agentName ?? "Assistente nao informado"}</p>
                    </div>
                    <StatusBadge status={franchise.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={Sparkles} title="Sem franquias prontas" description="Nenhuma unidade pronta para operar ainda." />
            )
          ) : (
            <div className="grid gap-3">
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Aguardando humano</p>
                <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{summary?.waitingHumanConversations ?? 0}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--color-bg-secondary)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>Canais ativos</p>
                <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{summary?.syncedChannels ?? 0}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
