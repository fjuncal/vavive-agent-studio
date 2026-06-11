import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { franchises } from "@/lib/mock-data";
import { Bot, CheckCircle2, MessageCircle, UsersRound } from "lucide-react";
import Link from "next/link";

export default async function FranchiseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const franchise = franchises.find((item) => item.id === id) ?? franchises[0];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Franquia"
        title={franchise.name}
        description={`${franchise.city} / ${franchise.state}. Dados comerciais e configuracoes desta unidade.`}
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leads" value={String(franchise.leads)} hint="Mock desta franquia" icon={UsersRound} />
        <StatCard label="Novos" value="12" hint="Aguardando atendimento" icon={MessageCircle} />
        <StatCard label="Agentes" value="1" hint="Conectado ao GPTMaker" icon={Bot} />
        <StatCard label="Setup" value="67%" hint="6 de 9 etapas" icon={CheckCircle2} />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Resumo operacional</h2>
            <StatusBadge status={franchise.status} />
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p className="rounded-xl bg-slate-50 p-4"><strong className="text-ink">Responsavel:</strong> {franchise.owner}</p>
            <p className="rounded-xl bg-slate-50 p-4"><strong className="text-ink">Regiao:</strong> bairros proximos e cobertura validada</p>
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
