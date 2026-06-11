import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { intentTemplates } from "@/lib/mock-data";
import { GitBranch, Plus } from "lucide-react";

export default async function AgentIntentionsPage({ params }: { params: Promise<{ id: string }> }) {
  await params;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Classificacao"
        title="Intencoes do agente"
        description="Defina os tipos de pedido que o agente deve reconhecer antes de responder ou transferir atendimento."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        {intentTemplates.map((intent) => (
          <article key={intent.title} className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <GitBranch size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-ink">Intencao de {intent.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{intent.description}</p>
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Exemplo: "{intent.example}"</p>
              </div>
            </div>
            <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">
              <Plus size={16} /> Adicionar intencao
            </button>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
