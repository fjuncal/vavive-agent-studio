import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { RuleBuilderCard } from "@/components/RuleBuilderCard";
import { ruleTemplates } from "@/lib/mock-data";

export default async function AgentRulesPage({ params }: { params: Promise<{ id: string }> }) {
  await params;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Guardrails"
        title="Regras do agente"
        description="Use regras objetivas para proteger a operacao, evitar promessas indevidas e transferir casos sensiveis."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        {ruleTemplates.map(([title, description]) => (
          <RuleBuilderCard key={title} title={title} description={description} />
        ))}
      </section>
      <div className="flex justify-end">
        <button className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-soft">Salvar e enviar para GPTMaker</button>
      </div>
    </AppShell>
  );
}
