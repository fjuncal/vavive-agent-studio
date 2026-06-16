"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getAgent, type AgentSummary } from "@/lib/api";
import { Bot } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const [agent, setAgent] = useState<AgentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    getAgent(params.id)
      .then(setAgent)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o agente.");
      });
  }, [params?.id]);

  return (
    <AppShell>
      <PageHeader eyebrow="Agente" title={agent?.name ?? "Carregando"} description={agent ? `Agente da ${agent.franchiseName}.` : "Carregando dados do agente."} />
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            {agent?.avatar ? (
              <img src={agent.avatar} alt={agent.name} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-line" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Bot size={26} />
              </div>
            )}
            <div>
            <h2 className="text-lg font-semibold text-ink">Configuracao atual</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Franquia: {agent?.franchiseName ?? "-"}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Tom de voz: {agent?.toneOfVoice ?? "-"}</p>
            </div>
          </div>
          <StatusBadge status={agent?.status ?? "ATIVO"} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href={`/agentes/${params?.id}/treinamentos`} className="rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white">Treinamentos</Link>
          <Link href={`/franquias/${agent?.franchiseId}/agente`} className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700">Configuracao da franquia</Link>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-500">Regras e intencoes ficam centralizadas no setup da franquia.</div>
        </div>
      </section>
    </AppShell>
  );
}
