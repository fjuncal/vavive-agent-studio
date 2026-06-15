import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ShieldCheck } from "lucide-react";

export default async function AgentRulesPage({ params }: { params: Promise<{ id: string }> }) {
  await params;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Guardrails"
        title="Regras do agente"
        description="Use regras objetivas para proteger a operacao, evitar promessas indevidas e transferir casos sensiveis."
      />
      <EmptyState
        icon={ShieldCheck}
        title="Regras ainda nao configuradas"
        description="As regras reais do agente serao exibidas aqui quando forem salvas pela configuracao ou treinamento."
      />
    </AppShell>
  );
}
