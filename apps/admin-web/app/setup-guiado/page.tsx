import { AppShell } from "@/components/AppShell";
import { Field, FormSection } from "@/components/FormSection";
import { PageHeader } from "@/components/PageHeader";
import { RuleBuilderCard } from "@/components/RuleBuilderCard";
import { Stepper } from "@/components/Stepper";
import { setupSteps } from "@/lib/mock-data";

export default function GuidedSetupPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Onboarding"
        title="Setup guiado"
        description="Transforme informacoes da franquia em treinamento pronto para revisao e envio ao GPTMaker."
      />
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Stepper steps={setupSteps} current={6} />
        <div className="grid gap-5">
          <FormSection title="Dados da franquia" description="Base para personalizar tom, cobertura e orientacoes do agente.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome comercial" placeholder="Vavive Vila Mariana" />
              <Field label="Responsavel" placeholder="Gestora Vila Mariana" />
              <Field label="Cidade" placeholder="Sao Paulo" />
              <Field label="Estado" placeholder="SP" />
            </div>
          </FormSection>

          <FormSection title="Servicos, precos e regioes" description="Informacoes que o agente deve pedir ou validar antes de responder.">
            <Field label="Servicos oferecidos" placeholder="Cuidador por hora, cuidador noturno, acompanhamento hospitalar" textarea />
            <Field label="Precos por hora" placeholder="Informe faixas aprovadas ou escreva que preco deve ser confirmado por humano" textarea />
            <Field label="Regioes atendidas" placeholder="Bairros, cidades e CEPs atendidos" textarea />
            <Field label="Horarios" placeholder="Horarios comerciais e disponibilidade de plantao" />
          </FormSection>

          <FormSection title="FAQ e tom de voz" description="Deixe respostas frequentes e a personalidade desejada para a conversa.">
            <Field label="FAQ" placeholder="Perguntas e respostas aprovadas pela franquia" textarea />
            <Field label="Tom de voz" placeholder="Acolhedor, objetivo e consultivo" />
          </FormSection>

          <section className="grid gap-4">
            <h2 className="text-lg font-semibold text-ink">Regras do agente</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <RuleBuilderCard title="Nunca inventar preço" description="Quando faltar preco, pedir contexto ou transferir para atendimento humano." />
              <RuleBuilderCard title="Nunca confirmar agenda sem validacao" description="O agente coleta dados, mas a equipe confirma a disponibilidade." />
            </div>
          </section>

          <section className="rounded-2xl bg-ink p-5 text-white shadow-soft">
            <h2 className="text-lg font-semibold">Revisao e geracao do treinamento</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">Ao concluir, a plataforma gera um bloco de treinamento Vavive e envia ao GPTMaker pela API Java.</p>
            <button className="mt-5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink">Gerar treinamento Vavive</button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
