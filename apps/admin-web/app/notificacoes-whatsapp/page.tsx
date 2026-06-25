"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { getFranchises, type FranchiseSummary } from "@/lib/api";
import { ArrowRight, Building2, Loader2, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function WhatsAppNotificationsIndexPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getFranchises()
      .then(setFranchises)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as franquias.");
      })
      .finally(() => setIsLoading(false));
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <AppShell>
        <EmptyState
          icon={MessageCircleMore}
          title="Acesso restrito"
          description="Somente SUPER_ADMIN pode configurar notificações por franquia."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="SUPER_ADMIN"
        title="Notificações WhatsApp"
        description="Escolha uma franquia para cadastrar os contatos que recebem avisos de agendamento e enviar uma mensagem de teste via Evolution."
      />

      {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div> : null}

      {isLoading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-600" />
          <p className="ml-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando franquias...</p>
        </div>
      ) : franchises.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {franchises.map((franchise) => (
            <article key={franchise.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{franchise.name}</h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {franchise.city} / {franchise.state}
                    </p>
                  </div>
                </div>
                <StatusBadge status={franchise.status} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/franquias/${franchise.id}/notificacoes-whatsapp`} className="btn-primary">
                  Configurar contatos e teste
                  <ArrowRight size={16} />
                </Link>
                <Link href={`/franquias/${franchise.id}`} className="btn-secondary">
                  Ver franquia
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={MessageCircleMore}
          title="Nenhuma franquia encontrada"
          description="Cadastre uma franquia antes de configurar notificações de agendamento."
          action={{ label: "Criar franquia", href: "/franquias/nova" }}
        />
      )}
    </AppShell>
  );
}
