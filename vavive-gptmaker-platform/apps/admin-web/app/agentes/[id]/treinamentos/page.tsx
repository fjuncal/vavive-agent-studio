import { AppShell } from "@/components/AppShell";
import { Field, FormSection } from "@/components/FormSection";
import { PageHeader } from "@/components/PageHeader";
import { TrainingPreviewCard } from "@/components/TrainingPreviewCard";
import { agents } from "@/lib/mock-data";

export default async function AgentTrainingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agents.find((item) => item.id === id) ?? agents[0];
  const preview = `Franquia: ${agent.franchise}
Servicos: cuidador por hora, cuidador noturno e acompanhamento hospitalar.
Regras: nao inventar preco, validar agenda e confirmar regiao antes de prometer atendimento.
Tom: ${agent.tone}.`;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Treinamento"
        title="Treinamentos do agente"
        description="Monte um bloco claro de conhecimento Vavive antes de enviar ao GPTMaker pelo backend."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <FormSection title="Gerar treinamento Vavive" description={`Agente: ${agent.name}`}>
          <Field label="Titulo do treinamento" placeholder="Servicos e regras comerciais da franquia" />
          <Field label="Dados da franquia" placeholder="Descreva servicos, regioes, horarios e limites de atendimento" textarea />
          <Field label="FAQ e objeções comuns" placeholder="Inclua perguntas frequentes e respostas aprovadas pela equipe" textarea />
          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">Gerar treinamento Vavive</button>
            <button className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft">Enviar para GPTMaker</button>
          </div>
        </FormSection>
        <TrainingPreviewCard title="Texto que sera enviado" content={preview} />
      </div>
    </AppShell>
  );
}
