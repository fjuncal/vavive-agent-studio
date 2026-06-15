"use client";

import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { getFranchises, getGptMakerWorkspaces, type FranchiseSummary, type GptMakerWorkspaceOption } from "@/lib/api";
import { Building2, PlugZap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FranchisesPage() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [workspaces, setWorkspaces] = useState<GptMakerWorkspaceOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
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

    setIsLoadingWorkspaces(true);
    setWorkspaceError(null);
    getGptMakerWorkspaces()
      .then(setWorkspaces)
      .catch((requestError) => {
        setWorkspaceError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os workspaces GPTMaker.");
      })
      .finally(() => setIsLoadingWorkspaces(false));
  }, [isSuperAdmin]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Rede"
        title="Franquias"
        description="Veja unidades, responsaveis e volume comercial. Usuarios ADMIN_FRANQUIA devem visualizar apenas sua propria unidade."
        actionLabel={isSuperAdmin ? "Nova franquia" : undefined}
        actionHref={isSuperAdmin ? "/franquias/nova" : undefined}
      />
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {franchises.length ? (
        <DataTable
          rows={franchises}
          columns={[
            { header: "Franquia", cell: (franchise) => <Link className="font-semibold text-ink hover:text-brand-700" href={`/franquias/${franchise.id}`}>{franchise.name}</Link> },
            { header: "Cidade", cell: (franchise) => `${franchise.city} / ${franchise.state}` },
            { header: "Documento", cell: (franchise) => franchise.document ?? "-" },
            { header: "Criada em", cell: (franchise) => franchise.createdAt ? new Date(franchise.createdAt).toLocaleDateString("pt-BR") : "-" },
            { header: "Status", cell: (franchise) => <StatusBadge status={franchise.status} /> }
          ]}
        />
      ) : (
        <EmptyState icon={Building2} title="Nenhuma franquia cadastrada" description="Quando o backend retornar franquias cadastradas, elas serao listadas aqui." />
      )}

      {isSuperAdmin ? (
        <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">GPTMaker</p>
              <h2 className="mt-2 text-lg font-semibold text-ink">Workspaces GPTMaker</h2>
              <p className="mt-2 text-sm text-slate-500">Workspaces disponiveis para conectar agentes das franquias.</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {isLoadingWorkspaces ? "Carregando..." : `${workspaces.length} workspace(s)`}
            </span>
          </div>
          {workspaceError ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{workspaceError}</p> : null}
          {workspaces.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {workspaces.map((workspace) => (
                <article key={workspace.id} className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
                      <PlugZap size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink">{workspace.name || "Workspace sem nome"}</h3>
                      <p className="mt-1 text-sm text-slate-500">Disponivel para vinculo de agentes.</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : !isLoadingWorkspaces && !workspaceError ? (
            <EmptyState icon={PlugZap} title="Nenhum workspace encontrado" description="Ainda nao ha dados reais para exibir." />
          ) : null}
        </section>
      ) : null}
    </AppShell>
  );
}
