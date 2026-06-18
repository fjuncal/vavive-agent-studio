"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Field, FormSection } from "@/components/FormSection";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TrainingPreviewCard } from "@/components/TrainingPreviewCard";
import { createAgentTraining, getAgent, getAgentTrainings, getGptMakerTrainings, deleteGptMakerTraining, type AgentSummary, type TrainingSummary } from "@/lib/api";
import { AlertCircle, BookOpenText, CheckCircle2, FileText, Loader2, Sparkles, Wand2, Trash2, Globe, Video, FileText as FileTextIcon, Type } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type TrainingForm = {
  title: string;
  type: "TEXT" | "WEBSITE" | "VIDEO" | "DOCUMENT";
  about: string;
  services: string;
  pricing: string;
  regions: string;
  schedules: string;
  faq: string;
  rules: string;
  tone: string;
};

const trainingTypes = [
  { value: "TEXT" as const, label: "Texto", icon: Type, description: "Conteúdo digitado diretamente" },
  { value: "WEBSITE" as const, label: "Website", icon: Globe, description: "Importar de URL" },
  { value: "VIDEO" as const, label: "Vídeo", icon: Video, description: "Transcrição de vídeo" },
  { value: "DOCUMENT" as const, label: "Documento", icon: FileTextIcon, description: "PDF, DOC, TXT" }
];

const defaultForm: TrainingForm = {
  title: "Treinamento comercial da franquia",
  type: "TEXT",
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
    title: "Use linguagem da operacao",
    description: "Preencha os blocos com informacoes da franquia. O sistema organiza o texto final para voce."
  },
  {
    title: "Revise antes de enviar",
    description: "Voce pode ajustar o texto final do treinamento antes da publicacao no GPTMaker."
  },
  {
    title: "Erro de integracao nao perde trabalho",
    description: "Se a publicacao falhar, o treinamento continua salvo localmente para nova tentativa."
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
  const [history, setHistory] = useState<TrainingSummary[]>([]);
  const [gptMakerTrainings, setGptMakerTrainings] = useState<unknown[]>([]);
  const [form, setForm] = useState<TrainingForm>(defaultForm);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    setIsLoading(true);
    Promise.all([getAgent(params.id), getAgentTrainings(params.id), getGptMakerTrainings(params.id).catch(() => [])])
      .then(([currentAgent, trainings, gptTrainings]) => {
        setAgent(currentAgent);
        setHistory(trainings);
        setGptMakerTrainings(gptTrainings);
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

  const agentReady = !!agent?.status && agent.status !== "PENDENTE_CONFIGURACAO";

  function updateField<K extends keyof TrainingForm>(field: K, value: TrainingForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleGenerate() {
    setPreview(buildTrainingContent(form, agent));
    setSuccess("Treinamento Vavive gerado para revisao.");
    setError(null);
  }

  async function handleDeleteGptMakerTraining(trainingId: string) {
    if (!params?.id) return;
    if (!confirm("Tem certeza que deseja excluir este treinamento do GPTMaker?")) return;

    setDeletingId(trainingId);
    try {
      await deleteGptMakerTraining(params.id, trainingId);
      setGptMakerTrainings((current) => current.filter((t: any) => t.id !== trainingId));
      setSuccess("Treinamento excluído com sucesso.");
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao excluir treinamento.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit() {
    if (!params?.id) {
      return;
    }
    if (!agentReady) {
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
      if (created.status === "PUBLICADO_GPTMAKER") {
        setSuccess("Treinamento publicado com sucesso.");
      } else {
        setError(created.message || "Nao foi possivel publicar o treinamento. Verifique a configuracao ou tente novamente.");
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
        description="Ensine o agente com informacoes da sua franquia e revise o conteudo antes de publicar."
      />
      {!agentReady ? <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">Agente ainda não configurado. O treinamento será salvo localmente até que a integração seja configurada.</div> : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Nao foi possivel concluir a publicacao.</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <section className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Status do agente</h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>Para publicar o treinamento, o agente precisa estar configurado.</p>
          </div>
          <StatusBadge status={agentReady ? "CONNECTED" : "ERROR"} />
        </div>
        <div className="mt-4 rounded-xl bg-mist dark:bg-slate-800/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--color-text-tertiary)" }}>Status</p>
          <p className="mt-2 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{agentReady ? "Conectado" : "Não configurado"}</p>
        </div>
        {!agentReady && agent ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <span>Configure o agente na tela da franquia antes de publicar.</span>
            <Link href={`/franquias/${agent.franchiseId}`} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              Configurar agente
            </Link>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {guidanceCards.map((item) => (
          <article key={item.title} className="card">
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.title}</h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>{item.description}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-5">
          <FormSection title="Gerar treinamento Vavive" description={agent ? `Agente: ${agent.name}` : "Carregando dados do agente..."}>
            <Field label="Titulo do treinamento" placeholder="Treinamento comercial da franquia" value={form.title} onChange={(value) => updateField("title", value)} />
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>Tipo de treinamento</label>
              <div className="grid grid-cols-2 gap-3">
                {trainingTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = form.type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateField("type", type.value)}
                      className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30"
                          : "border-line/80 bg-white dark:bg-slate-900 hover:border-brand-300"
                      }`}
                    >
                      <Icon size={20} className={isSelected ? "text-brand-600" : "text-slate-400"} />
                      <div>
                        <p className={`text-sm font-semibold ${isSelected ? "text-brand-700 dark:text-brand-300" : ""}`} style={!isSelected ? { color: "var(--color-text-primary)" } : undefined}>{type.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{type.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
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
            <div className="rounded-2xl bg-mist dark:bg-slate-800/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-tertiary)" }}>Exemplos prontos</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {readyExamples.map((item) => (
                  <span key={item} className="rounded-full bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium shadow-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line/80 bg-white dark:bg-slate-900 p-4">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Revisao final</p>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>
                Antes de enviar ao GPTMaker, revise o texto abaixo. Ele pode ser ajustado diretamente na plataforma, sem expor detalhes tecnicos.
              </p>
              <textarea
                className="input-field mt-4 min-h-[220px] leading-7"
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
                disabled={isSubmitting || isLoading || !agentReady}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Publicar treinamento
              </button>
            </div>
          </FormSection>

          <FormSection title="Historico de treinamentos enviados" description="Acompanhe o que ja foi salvo, publicado ou ficou pendente de nova tentativa.">
            {history.length ? (
              <div className="grid gap-3">
                {history.map((training) => (
                  <article key={training.id} className="rounded-2xl border border-line/80 bg-white dark:bg-slate-900 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{training.title}</h3>
                        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{formatDate(training.createdAt)}</p>
                      </div>
                      <StatusBadge status={training.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>{training.message || "Treinamento salvo."}</p>
                    {training.status === "SALVO_LOCALMENTE" ? <p className="mt-2 rounded-lg bg-amber-100 dark:bg-amber-950/50 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300">Salvo localmente</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="Nenhum treinamento enviado ainda" description="Gere o primeiro treinamento Vavive e revise o texto antes de publicar." />
            )}
          </FormSection>

          <FormSection title="Treinamentos no GPTMaker" description="Treinamentos sincronizados com a plataforma GPTMaker.">
            {gptMakerTrainings.length ? (
              <div className="grid gap-3">
                {gptMakerTrainings.map((training: any) => (
                  <article key={training.id} className="rounded-2xl border border-line/80 bg-white dark:bg-slate-900 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{training.title || training.name || "Treinamento"}</h3>
                          {training.type && (
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                              {training.type}
                            </span>
                          )}
                        </div>
                        {training.createdAt && (
                          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{formatDate(training.createdAt)}</p>
                        )}
                        {training.description && (
                          <p className="mt-2 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>{training.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteGptMakerTraining(training.id)}
                        disabled={deletingId === training.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 disabled:opacity-50"
                      >
                        {deletingId === training.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="Nenhum treinamento no GPTMaker" description="Treinamentos publicados aparecerão aqui." />
            )}
          </FormSection>
        </div>

        <div className="grid gap-5">
          <TrainingPreviewCard title={form.title || "Treinamento Vavive"} content={preview || "Preencha os blocos e gere o texto para visualizar o treinamento final."} />
          <section className="card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <BookOpenText size={20} />
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Como usar bem</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Quanto mais claro o contexto da franquia, melhor o comportamento do agente.</p>
              </div>
            </div>
            <ul className="mt-4 grid gap-3 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>
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
