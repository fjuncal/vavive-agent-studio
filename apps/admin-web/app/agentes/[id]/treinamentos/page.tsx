"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Field, FormSection } from "@/components/FormSection";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TrainingPreviewCard } from "@/components/TrainingPreviewCard";
import { createAgentTraining, getAgentTrainings, getAgents, getGptMakerHealth, type AgentSummary, type GptMakerHealth, type TrainingSummary } from "@/lib/api";
import { AlertCircle, BookOpenText, CheckCircle2, FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type TrainingForm = {
  title: string;
  about: string;
  services: string;
  pricing: string;
  regions: string;
  schedules: string;
  faq: string;
  rules: string;
  tone: string;
};

const defaultForm: TrainingForm = {
  title: "Treinamento comercial da franquia",
  about: "",
  services: "",
  pricing: "",
  regions: "",
  schedules: "",
  faq: "",
  rules: "",
  tone: ""
};

const guidanceCards = [
  {
    title: "Nao escreva prompt tecnico",
    description: "Preencha os blocos com informacoes da operacao. O sistema organiza o texto final para voce."
  },
  {
    title: "Revise antes de enviar",
    description: "Voce pode ajustar o texto final do treinamento antes da publicacao no GPTMaker."
  },
  {
    title: "Erro de integracao nao perde trabalho",
    description: "Se o GPTMaker falhar, o treinamento continua salvo localmente para nova tentativa."
  }
];

const readyExamples = [
  "Servico: cuidador por hora, plantao noturno e acompanhamento hospitalar.",
  "Preco: confirmar faixa somente apos validar servico, duracao e regiao.",
  "Regra: nunca confirmar agenda sem validacao da equipe humana."
];

function buildTrainingContent(form: TrainingForm, agent: AgentSummary | null) {
  const sections = [
    `AGENTE: ${agent?.name ?? "Assistente Vavive"}`,
    `FRANQUIA: ${agent?.franchiseName ?? "Franquia Vavive"}`,
    "",
    "SOBRE A FRANQUIA",
    form.about || "Nao informado",
    "",
    "SERVICOS OFERECIDOS",
    form.services || "Nao informado",
    "",
    "PRECOS E DURACAO",
    form.pricing || "Nao informado",
    "",
    "REGIOES ATENDIDAS",
    form.regions || "Nao informado",
    "",
    "HORARIOS DE ATENDIMENTO",
    form.schedules || "Nao informado",
    "",
    "PERGUNTAS FREQUENTES",
    form.faq || "Nao informado",
    "",
    "REGRAS IMPORTANTES",
    form.rules || "Nao informado",
    "",
    "TOM DE VOZ",
    form.tone || agent?.toneOfVoice || "Nao informado"
  ];

  return sections.join("\n");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AgentTrainingsPage() {
  const params = useParams<{ id: string }>();
  const [agent, setAgent] = useState<AgentSummary | null>(null);
  const [gptMakerHealth, setGptMakerHealth] = useState<GptMakerHealth | null>(null);
  const [history, setHistory] = useState<TrainingSummary[]>([]);
  const [form, setForm] = useState<TrainingForm>(defaultForm);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    setIsLoading(true);
    Promise.all([getAgents(), getAgentTrainings(params.id), getGptMakerHealth()])
      .then(([agents, trainings, health]) => {
        const currentAgent = agents.find((item) => item.id === params.id) ?? null;
        setAgent(currentAgent);
        setHistory(trainings);
        setGptMakerHealth(health);
        const nextForm = {
          ...defaultForm,
          title: "Treinamento comercial da franquia",
          about: currentAgent ? `Franquia ${currentAgent.franchiseName}. Use atendimento claro, seguro e acolhedor.` : "",
          tone: currentAgent?.toneOfVoice ?? ""
        };
        setForm((current) => ({
          ...current,
          ...nextForm
        }));
        setPreview(buildTrainingContent(nextForm, currentAgent));
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os dados de treinamento.");
      })
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  const hasRealExternalId = !!agent?.connectedToRealGptMaker;

  function updateField<K extends keyof TrainingForm>(field: K, value: TrainingForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleGenerate() {
    setPreview(buildTrainingContent(form, agent));
    setSuccess("Treinamento Vavive gerado para revisao.");
    setError(null);
  }

  async function handleSubmit() {
    if (!params?.id) {
      return;
    }
    if (!hasRealExternalId) {
      setError("Para publicar no GPTMaker, este agente precisa estar vinculado a um agente real na tela da franquia.");
      setSuccess(null);
      return;
    }
    if (!form.title.trim() || !preview.trim()) {
      setError("Preencha o titulo e gere ou revise o treinamento antes de enviar.");
      setSuccess(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createAgentTraining(params.id, {
        title: form.title,
        content: preview
      });
      setHistory((current) => [created, ...current]);
      if (created.status === "PUBLICADO_GPTMAKER_MOCK") {
        setSuccess("Publicacao simulada em ambiente de desenvolvimento.");
      } else if (created.status === "PUBLICADO_GPTMAKER") {
        setSuccess("Agente publicado no GPTMaker com sucesso.");
      } else {
        setError(created.message || "Nao foi possivel publicar no GPTMaker. Verifique a configuracao da integracao ou tente novamente.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel publicar no GPTMaker. Verifique a configuracao da integracao ou tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Treinamento"
        title="Treinamento do Agente"
        description="Ensine o agente com informacoes da sua franquia sem precisar escrever prompts tecnicos."
      />
      {!hasRealExternalId ? <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Ambiente de desenvolvimento: sem agente GPTMaker real conectado, este fluxo permanece apenas em modo local.</div> : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Nao foi possivel concluir a publicacao no GPTMaker.</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Conexao GPTMaker</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Para publicar no GPTMaker, este agente precisa estar vinculado a um agente real na tela da franquia.</p>
          </div>
          <StatusBadge status={hasRealExternalId ? "CONNECTED" : "ERROR"} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</p>
            <p className="mt-2 text-sm font-semibold text-ink">{hasRealExternalId ? "Conectado" : "Nao conectado"}</p>
          </div>
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">External ID</p>
            <p className="mt-2 break-all text-sm font-semibold text-ink">{agent?.externalId || "Nao configurado"}</p>
          </div>
          <div className="rounded-xl bg-mist px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Modo</p>
            <p className="mt-2 text-sm font-semibold text-ink">{gptMakerHealth?.mockEnabled ? "Ambiente de desenvolvimento" : "Integracao ativa"}</p>
          </div>
        </div>
        {!hasRealExternalId && agent ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>Conecte este agente a um agente GPTMaker real antes de publicar.</span>
            <Link href={`/franquias/${agent.franchiseId}`} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              Conectar agente GPTMaker
            </Link>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {guidanceCards.map((item) => (
          <article key={item.title} className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <h2 className="text-base font-semibold text-ink">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-5">
          <FormSection title="Gerar treinamento Vavive" description={agent ? `Agente: ${agent.name}` : "Carregando dados do agente..."}>
            <Field label="Titulo do treinamento" placeholder="Treinamento comercial da franquia" value={form.title} onChange={(value) => updateField("title", value)} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Sobre a franquia" placeholder="Contexto da unidade, diferenciais e cuidados atendidos" textarea value={form.about} onChange={(value) => updateField("about", value)} />
              <Field label="Servicos oferecidos" placeholder="Cuidador por hora, plantao noturno, acompanhamento hospitalar" textarea value={form.services} onChange={(value) => updateField("services", value)} />
              <Field label="Precos e duracao" placeholder="Faixas aprovadas ou quando o valor precisa de validacao humana" textarea value={form.pricing} onChange={(value) => updateField("pricing", value)} />
              <Field label="Regioes atendidas" placeholder="Bairros, cidades, CEPs e excecoes" textarea value={form.regions} onChange={(value) => updateField("regions", value)} />
              <Field label="Horarios de atendimento" placeholder="Horario comercial, plantao e restricoes" textarea value={form.schedules} onChange={(value) => updateField("schedules", value)} />
              <Field label="Perguntas frequentes" placeholder="Pergunta: ... / Resposta: ..." textarea value={form.faq} onChange={(value) => updateField("faq", value)} />
              <Field label="Regras importantes" placeholder="Nunca inventar preco, nunca confirmar agenda sem validacao..." textarea value={form.rules} onChange={(value) => updateField("rules", value)} />
              <Field label="Tom de voz" placeholder="Acolhedor, claro, consultivo" textarea value={form.tone} onChange={(value) => updateField("tone", value)} />
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Exemplos prontos</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {readyExamples.map((item) => (
                  <span key={item} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line/80 bg-white p-4">
              <p className="text-sm font-semibold text-ink">Revisao final</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Antes de enviar ao GPTMaker, revise o texto abaixo. Ele pode ser ajustado diretamente na plataforma, sem expor detalhes tecnicos.
              </p>
              <textarea
                className="mt-4 min-h-[220px] w-full rounded-xl border border-line bg-white px-3 py-3 text-sm leading-7 text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                value={preview}
                onChange={(event) => setPreview(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleGenerate} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">
                <Wand2 size={16} />
                Gerar treinamento Vavive
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || isLoading || !hasRealExternalId}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Enviar para GPTMaker
              </button>
            </div>
          </FormSection>

          <FormSection title="Historico de treinamentos enviados" description="Acompanhe o que ja foi salvo, publicado ou ficou pendente de nova tentativa.">
            {history.length ? (
              <div className="grid gap-3">
                {history.map((training) => (
                  <article key={training.id} className="rounded-2xl border border-line/80 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-ink">{training.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(training.createdAt)}</p>
                      </div>
                      <StatusBadge status={training.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{training.message || "Treinamento salvo."}</p>
                    {training.mockEnabled || training.status === "SALVO_LOCALMENTE" ? <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">Ambiente de desenvolvimento</p> : null}
                    {training.externalReference ? <p className="mt-2 text-xs text-slate-400">Referencia: {training.externalReference}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="Nenhum treinamento enviado ainda" description="Gere o primeiro treinamento Vavive e revise o texto antes de publicar." />
            )}
          </FormSection>
        </div>

        <div className="grid gap-5">
          <TrainingPreviewCard title={form.title || "Treinamento Vavive"} content={preview || "Preencha os blocos e gere o texto para visualizar o treinamento final."} />
          <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <BookOpenText size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-ink">Como usar bem</h2>
                <p className="mt-1 text-sm text-slate-500">Quanto mais claro o contexto da franquia, melhor o comportamento do agente.</p>
              </div>
            </div>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
              <li>Explique o que a franquia faz e onde atende.</li>
              <li>Deixe claro quando o agente deve transferir para atendimento humano.</li>
              <li>Revise precos e promessas antes de publicar.</li>
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
