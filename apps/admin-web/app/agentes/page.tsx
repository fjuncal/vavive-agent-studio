"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { getFranchises, type FranchiseSummary } from "@/lib/api";
import { Bot, Building2, FileText, PlugZap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function statusFor(franchise: FranchiseSummary) {
  if (!franchise.workspaceId) {
    return "SEM_WORKSPACE";
  }
  if (!franchise.agentId) {
    return "SEM_AGENTE";
  }
  return "CONECTADO";
}

export default function AgentsPage() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    getFranchises()
      .then(setFranchises)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as franquias.");
      });
  }, []);

  return (
    <AppShell>
      <PageHeader
        eyebrow="GPTMaker"
        title="Agentes por franquia"
        description={isSuperAdmin ? "Acompanhe workspaces e agentes conectados por unidade." : "Veja a configuracao do agente da sua franquia."}
      />
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {franchises.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {franchises.map((franchise) => (
            <article key={franchise.id} className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink">{franchise.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{franchise.city} / {franchise.state}</p>
                  </div>
                </div>
                <StatusBadge status={statusFor(franchise)} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {isSuperAdmin ? (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <PlugZap size={16} />
                      Workspace
                    </div>
                    <p className="mt-2">{franchise.workspaceName ?? "Sem workspace vinculada"}</p>
                  </div>
                ) : null}
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2 font-semibold text-ink">
                    <Bot size={16} />
                    Agente
                  </div>
                  <p className="mt-2">{franchise.agentName ?? "Sem agente conectado"}</p>
                </div>
              </div>

              {!isSuperAdmin && franchise.status === "PENDENTE_CONFIGURACAO" ? (
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Sua franquia ainda nao esta ativa. Aguarde a configuracao pela matriz.</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/franquias/${franchise.id}`} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">
                  Abrir franquia
                </Link>
                {franchise.agentId ? (
                  <Link href="/setup-guiado" className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">
                    <FileText size={16} />
                    Setup do agente
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState icon={Bot} title="Nenhum agente encontrado" description="Ainda nao ha dados reais para exibir." />
      )}
    </AppShell>
  );
}
