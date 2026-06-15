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
      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Configuracao demonstrativa - sera integrada ao GPTMaker nas proximas etapas.
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        {ruleTemplates.map(([title, description]) => (
          <RuleBuilderCard key={title} title={title} description={description} />
        ))}
      </section>
      <div className="flex justify-end">
        <button className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600" disabled>Integracao futura</button>
      </div>
    </AppShell>
  );
}
