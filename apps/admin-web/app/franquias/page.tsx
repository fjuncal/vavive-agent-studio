import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { franchises } from "@/lib/mock-data";
import Link from "next/link";

export default function FranchisesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Rede"
        title="Franquias"
        description="Veja unidades, responsaveis e volume comercial. Usuarios ADMIN_FRANQUIA devem visualizar apenas sua propria unidade."
        actionLabel="Nova franquia"
        actionHref="/franquias/nova"
      />
      <DataTable
        rows={franchises}
        columns={[
          { header: "Franquia", cell: (franchise) => <Link className="font-semibold text-ink hover:text-brand-700" href={`/franquias/${franchise.id}`}>{franchise.name}</Link> },
          { header: "Cidade", cell: (franchise) => `${franchise.city} / ${franchise.state}` },
          { header: "Responsavel", cell: (franchise) => franchise.owner },
          { header: "Leads", cell: (franchise) => <span className="font-semibold text-ink">{franchise.leads}</span> },
          { header: "Status", cell: (franchise) => <StatusBadge status={franchise.status} /> }
        ]}
      />
    </AppShell>
  );
}
