"use client";

import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { getFranchises, type FranchiseSummary } from "@/lib/api";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FranchisesPage() {
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
    </AppShell>
  );
}
