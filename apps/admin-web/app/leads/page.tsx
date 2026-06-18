"use client";

import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getLeads, type LeadSummary } from "@/lib/api";
import { MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeads()
      .then(setLeads)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os leads.");
      });
  }, []);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Comercial"
        title="Leads"
        description="Leads registrados pelas franquias. Acompanhe o status comercial de cada contato."
      />
      {error ? <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
      {leads.length ? (
        <DataTable
          rows={leads}
          columns={[
            { header: "Nome", cell: (lead) => <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{lead.name}</span> },
            { header: "Telefone", cell: (lead) => lead.phone },
            { header: "Servico", cell: (lead) => lead.service },
            { header: "Origem", cell: (lead) => lead.source },
            { header: "Franquia", cell: (lead) => lead.franchiseName },
            { header: "Status", cell: (lead) => <StatusBadge status={lead.status} /> }
          ]}
        />
      ) : (
        <EmptyState icon={MessageSquareText} title="Nenhum lead encontrado" description="Quando uma franquia receber contatos qualificados, eles aparecerao aqui com status comercial." />
      )}
    </AppShell>
  );
}
