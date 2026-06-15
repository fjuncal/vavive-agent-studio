import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { GitBranch } from "lucide-react";

export default async function AgentIntentionsPage({ params }: { params: Promise<{ id: string }> }) {
  await params;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Classificacao"
        title="Intencoes do agente"
        description="Defina os tipos de pedido que o agente deve reconhecer antes de responder ou transferir atendimento."
      />
      <EmptyState
        icon={GitBranch}
        title="Intencoes ainda nao configuradas"
        description="Quando a integracao de classificacao estiver disponivel, as intencoes reais deste agente aparecerao aqui."
      />
    </AppShell>
  );
}
