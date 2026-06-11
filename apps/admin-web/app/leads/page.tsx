import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { leads } from "@/lib/mock-data";
import { MessageSquareText } from "lucide-react";

export default function LeadsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Comercial"
        title="Leads"
        description="Leads pertencem ao banco da Vavive. No futuro, chats e contatos podem ser sincronizados do GPTMaker pelo backend."
      />
      {leads.length ? (
        <DataTable
          rows={leads}
          columns={[
            { header: "Nome", cell: (lead) => <span className="font-semibold text-ink">{lead.name}</span> },
            { header: "Telefone", cell: (lead) => lead.phone },
            { header: "Servico", cell: (lead) => lead.service },
            { header: "Origem", cell: (lead) => lead.source },
            { header: "Franquia", cell: (lead) => lead.franchise },
            { header: "Status", cell: (lead) => <StatusBadge status={lead.status} /> }
          ]}
        />
      ) : (
        <EmptyState icon={MessageSquareText} title="Nenhum lead encontrado" description="Quando uma franquia receber contatos qualificados, eles aparecerao aqui com status comercial." />
      )}
    </AppShell>
  );
}
