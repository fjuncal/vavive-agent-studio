"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getFranchiseById, type FranchiseSummary } from "@/lib/api";
import { Bot, CheckCircle2, MessageCircle, UsersRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function FranchiseDetailPage() {
  const params = useParams<{ id: string }>();
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) {
      return;
    }
    getFranchiseById(params.id)
      .then(setFranchise)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar a franquia.");
      });
  }, [params?.id]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Franquia"
        title={franchise?.name ?? "Carregando franquia"}
        description={franchise ? `${franchise.city} / ${franchise.state}. Dados comerciais e configuracoes desta unidade.` : "Buscando dados da franquia no backend."}
      />
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leads" value="--" hint="Resumo detalhado ainda sera ampliado" icon={UsersRound} />
        <StatCard label="Novos" value="--" hint="Aguardando endpoint detalhado" icon={MessageCircle} />
        <StatCard label="Agentes" value="--" hint="Ligacao com agentes ainda simplificada" icon={Bot} />
        <StatCard label="Setup" value="67%" hint="6 de 9 etapas" icon={CheckCircle2} />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Resumo operacional</h2>
            <StatusBadge status={franchise?.status ?? "ATIVA"} />
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p className="rounded-xl bg-slate-50 p-4"><strong className="text-ink">Documento:</strong> {franchise?.document ?? "-"}</p>
            <p className="rounded-xl bg-slate-50 p-4"><strong className="text-ink">Regiao:</strong> cobertura operacional configurada no setup guiado</p>
            <p className="rounded-xl bg-slate-50 p-4"><strong className="text-ink">Horario:</strong> atendimento comercial 8h-18h</p>
            <p className="rounded-xl bg-slate-50 p-4"><strong className="text-ink">Permissao:</strong> ADMIN_FRANQUIA limitado a esta unidade</p>
          </div>
        </div>
        <div className="rounded-2xl bg-ink p-5 text-white shadow-soft">
          <h2 className="text-lg font-semibold">Setup guiado</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">Complete dados da franquia antes de gerar novos treinamentos.</p>
          <Link href="/setup-guiado" className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink">Abrir setup</Link>
        </div>
      </section>
    </AppShell>
  );
}
