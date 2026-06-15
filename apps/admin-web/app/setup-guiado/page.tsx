"use client";

import { AppShell } from "@/components/AppShell";
import { Field, FormSection } from "@/components/FormSection";
import { PageHeader } from "@/components/PageHeader";
import { RuleBuilderCard } from "@/components/RuleBuilderCard";
import { Stepper } from "@/components/Stepper";
import { TrainingPreviewCard } from "@/components/TrainingPreviewCard";
import { useAuth } from "@/lib/auth";
import {
  getFranchiseSetup,
  getFranchises,
  getDefaultAgentTexts,
  publishFranchiseAgent,
  saveFranchiseSetup,
  type DefaultAgentText,
  type FranchiseSetup,
  type FranchiseSummary,
  type PublishAgentResult,
  type UpdateFranchiseSetupPayload
} from "@/lib/api";
import clsx from "clsx";
import { AlertCircle, CheckCircle2, Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const setupSteps = ["Dados da Franquia", "Servicos", "Precos", "Regioes", "Horarios", "FAQ", "Regras", "Tom de Voz", "Revisao Final"];

type RuleTemplate = {
  title: string;
  description: string;
};

type SetupFormState = {
  franchiseName: string;
  document: string;
  city: string;
  state: string;
  responsibleName: string;
  services: string;
  prices: string;
  regions: string;
  schedules: string;
  faq: string;
  customRules: string;
  toneOfVoice: string;
};

const emptyForm: SetupFormState = {
  franchiseName: "",
  document: "",
  city: "",
  state: "",
  responsibleName: "",
  services: "",
  prices: "",
  regions: "",
  schedules: "",
  faq: "",
  customRules: "",
  toneOfVoice: ""
};

function normalizeValue(value?: string | null) {
  return value ?? "";
}

function splitRules(rawRules: string | null | undefined, ruleTemplates: RuleTemplate[]) {
  const lines = normalizeValue(rawRules)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const selectedTitles = ruleTemplates
    .map((rule) => rule.title)
    .filter((title) => lines.some((line) => line.toLowerCase() === title.toLowerCase()));
  const customRules = lines.filter((line) => !selectedTitles.some((title) => title.toLowerCase() === line.toLowerCase())).join("\n");
  return { selectedTitles, customRules };
}

function toFormState(setup: FranchiseSetup, ruleTemplates: RuleTemplate[]): SetupFormState {
  const parsedRules = splitRules(setup.rules, ruleTemplates);
  return {
    franchiseName: normalizeValue(setup.franchiseName),
    document: normalizeValue(setup.document),
    city: normalizeValue(setup.city),
    state: normalizeValue(setup.state),
    responsibleName: normalizeValue(setup.responsibleName),
    services: normalizeValue(setup.services),
    prices: normalizeValue(setup.prices),
    regions: normalizeValue(setup.regions),
    schedules: normalizeValue(setup.schedules),
    faq: normalizeValue(setup.faq),
    customRules: parsedRules.customRules,
    toneOfVoice: normalizeValue(setup.toneOfVoice)
  };
}

function buildRulesPayload(selectedRuleTitles: string[], customRules: string) {
  return [...selectedRuleTitles, ...customRules.split("\n").map((line) => line.trim()).filter(Boolean)].join("\n");
}

function buildTrainingPreview(form: SetupFormState, selectedRuleTitles: string[]) {
  const sections = [
    "TREINAMENTO VAVIVE",
    "",
    `FRANQUIA: ${form.franchiseName || "Nao informado"}`,
    `RESPONSAVEL: ${form.responsibleName || "Nao informado"}`,
    `LOCALIZACAO: ${[form.city, form.state].filter(Boolean).join(" / ") || "Nao informado"}`,
    "",
    "SERVICOS APROVADOS:",
    form.services || "Nao informado",
    "",
    "PRECOS E DIRETRIZES COMERCIAIS:",
    form.prices || "Nao informado",
    "",
    "REGIOES ATENDIDAS:",
    form.regions || "Nao informado",
    "",
    "HORARIOS E DISPONIBILIDADE:",
    form.schedules || "Nao informado",
    "",
    "FAQ APROVADO:",
    form.faq || "Nao informado",
    "",
    "REGRAS DO AGENTE:",
    buildRulesPayload(selectedRuleTitles, form.customRules) || "Nao informado",
    "",
    "TOM DE VOZ:",
    form.toneOfVoice || "Nao informado",
    "",
    "ORIENTACAO FINAL:",
    "Nunca invente informacoes. Quando faltar contexto, colete os dados necessarios ou transfira para a equipe humana."
  ];

  return sections.join("\n");
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Ainda nao publicado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function SectionSummary({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-line/80 bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{content || "Nao informado"}</p>
    </div>
  );
}

export default function GuidedSetupPage() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [defaultTexts, setDefaultTexts] = useState<DefaultAgentText[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("");
  const [setup, setSetup] = useState<FranchiseSetup | null>(null);
  const [form, setForm] = useState<SetupFormState>(emptyForm);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishAgentResult | null>(null);

  const ruleTemplates = useMemo(
    () => defaultTexts
      .filter((text) => text.active && text.category === "REGRAS_ATENDIMENTO")
      .map((text) => ({ title: text.title, description: text.content })),
    [defaultTexts]
  );
  const toneSuggestions = useMemo(
    () => defaultTexts.filter((text) => text.active && text.category === "TOM_DE_VOZ"),
    [defaultTexts]
  );
  const progressLabel = setup ? `${setup.completionPercentage}% concluido - ${setup.setupStatus.replaceAll("_", " ")}` : "Carregando configuracao";
  const previewTitle = useMemo(() => `Treinamento ${form.franchiseName || "Vavive"}`, [form.franchiseName]);
  const previewContent = useMemo(() => setup?.lastGeneratedTraining || buildTrainingPreview(form, selectedRules), [form, selectedRules, setup?.lastGeneratedTraining]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    getFranchises()
      .then((items) => {
        setFranchises(items);
        const defaultId = user.role === "ADMIN_FRANQUIA" ? user.franchise?.id : items[0]?.id;
        if (defaultId) {
          setSelectedFranchiseId((current) => current || defaultId);
        }
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as franquias.");
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") {
      setDefaultTexts([]);
      return;
    }

    getDefaultAgentTexts()
      .then((items) => setDefaultTexts(items.filter((item) => item.active)))
      .catch(() => setDefaultTexts([]));
  }, [user?.role]);

  useEffect(() => {
    if (!selectedFranchiseId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setPublishResult(null);

    getFranchiseSetup(selectedFranchiseId)
      .then((response) => {
        setSetup(response);
        setForm(toFormState(response, ruleTemplates));
        setSelectedRules(splitRules(response.rules, ruleTemplates).selectedTitles);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o setup da franquia.");
      })
      .finally(() => setIsLoading(false));
  }, [selectedFranchiseId, ruleTemplates]);

  function updateField<K extends keyof SetupFormState>(field: K, value: SetupFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleRule(title: string, checked: boolean) {
    setSelectedRules((current) => {
      if (checked) {
        return current.includes(title) ? current : [...current, title];
      }
      return current.filter((item) => item !== title);
    });
  }

  function buildPayload(): UpdateFranchiseSetupPayload {
    return {
      franchiseName: form.franchiseName,
      document: form.document,
      city: form.city,
      state: form.state,
      responsibleName: form.responsibleName,
      services: form.services,
      prices: form.prices,
      regions: form.regions,
      schedules: form.schedules,
      faq: form.faq,
      rules: buildRulesPayload(selectedRules, form.customRules),
      toneOfVoice: form.toneOfVoice
    };
  }

  async function persistSetup() {
    if (!selectedFranchiseId) {
      return null;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await saveFranchiseSetup(selectedFranchiseId, buildPayload());
      setSetup(response);
      setForm(toFormState(response, ruleTemplates));
      setSelectedRules(splitRules(response.rules, ruleTemplates).selectedTitles);
      setSuccessMessage("Etapa salva com sucesso.");
      return response;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar esta etapa.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStepAdvance(nextStep: number) {
    const response = await persistSetup();
    if (response) {
      setCurrentStep(nextStep);
    }
  }

  async function handlePublish() {
    const response = await persistSetup();
    if (!response || !selectedFranchiseId) {
      return;
    }

    setIsPublishing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await publishFranchiseAgent(selectedFranchiseId);
      setPublishResult(result);
      if (result.mockEnabled) {
        setSuccessMessage("Publicacao simulada em ambiente de desenvolvimento.");
      } else if (result.success) {
        setSuccessMessage("Agente publicado no GPTMaker com sucesso.");
      } else {
        setSuccessMessage(null);
      }
      const refreshedSetup = await getFranchiseSetup(selectedFranchiseId);
      setSetup(refreshedSetup);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel publicar o agente.");
    } finally {
      setIsPublishing(false);
    }
  }

  const reviewItems = [
    { title: "Franquia", content: [form.franchiseName, form.document, [form.city, form.state].filter(Boolean).join(" / "), form.responsibleName].filter(Boolean).join("\n") },
    { title: "Servicos", content: form.services },
    { title: "Precos", content: form.prices },
    { title: "Regioes", content: form.regions },
    { title: "Horarios", content: form.schedules },
    { title: "FAQ", content: form.faq },
    { title: "Regras", content: buildRulesPayload(selectedRules, form.customRules) },
    { title: "Tom de voz", content: form.toneOfVoice }
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Onboarding"
        title="Setup guiado"
        description="Configure a franquia, gere o treinamento Vavive e publique o agente GPTMaker sem depender das telas tecnicas."
      />

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Stepper
          steps={setupSteps}
          current={currentStep}
          completed={setup ? setupSteps.map((_, index) => (index < Math.floor((setup.completionPercentage / 100) * 8) ? index : -1)).filter((index) => index >= 0) : []}
          progressLabel={progressLabel}
          onStepClick={(index) => {
            if (isSaving || isPublishing) {
              return;
            }
            void handleStepAdvance(index);
          }}
        />

        <div className="grid gap-5">
          <FormSection title="Contexto da franquia" description="Selecione a franquia que sera configurada neste fluxo principal.">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Franquia</span>
              <select
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                value={selectedFranchiseId}
                onChange={(event) => {
                  setCurrentStep(0);
                  setSelectedFranchiseId(event.target.value);
                }}
                disabled={isLoading || user?.role === "ADMIN_FRANQUIA"}
              >
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.name}
                  </option>
                ))}
              </select>
            </label>
          </FormSection>

          {isLoading ? (
            <section className="rounded-2xl border border-line/80 bg-white/86 p-6 shadow-soft">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Carregando configuracao da franquia...
              </div>
            </section>
          ) : null}

          {!isLoading && currentStep === 0 ? (
            <FormSection title="Dados da Franquia" description="Base comercial e operacional usada em todo o treinamento do agente.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome comercial" placeholder="Vavive Vila Mariana" value={form.franchiseName} onChange={(value) => updateField("franchiseName", value)} />
                <Field label="Responsavel" placeholder="Gestora da unidade" value={form.responsibleName} onChange={(value) => updateField("responsibleName", value)} />
                <Field label="Documento" placeholder="CNPJ da franquia" value={form.document} onChange={(value) => updateField("document", value)} />
                <Field label="Cidade" placeholder="Sao Paulo" value={form.city} onChange={(value) => updateField("city", value)} />
                <Field label="Estado" placeholder="SP" value={form.state} onChange={(value) => updateField("state", value)} />
              </div>
            </FormSection>
          ) : null}

          {!isLoading && currentStep === 1 ? (
            <FormSection title="Servicos" description="Liste os servicos que o agente pode apresentar ou usar para triagem.">
              <Field label="Servicos oferecidos" placeholder="Cuidador por hora, plantao noturno, acompanhamento hospitalar" textarea value={form.services} onChange={(value) => updateField("services", value)} />
            </FormSection>
          ) : null}

          {!isLoading && currentStep === 2 ? (
            <FormSection title="Precos" description="Explique como o agente deve responder quando o cliente pedir valores.">
              <Field label="Precos e diretrizes comerciais" placeholder="Faixas aprovadas, condicoes e quando escalar para humano" textarea value={form.prices} onChange={(value) => updateField("prices", value)} />
            </FormSection>
          ) : null}

          {!isLoading && currentStep === 3 ? (
            <FormSection title="Regioes" description="Defina bairros, cidades e regras de cobertura.">
              <Field label="Regioes atendidas" placeholder="Bairros, cidades, CEPs ou excecoes importantes" textarea value={form.regions} onChange={(value) => updateField("regions", value)} />
            </FormSection>
          ) : null}

          {!isLoading && currentStep === 4 ? (
            <FormSection title="Horarios" description="Informe disponibilidade de atendimento, janelas e plantao.">
              <Field label="Horarios e disponibilidade" placeholder="Horario comercial, plantao e restricoes" textarea value={form.schedules} onChange={(value) => updateField("schedules", value)} />
            </FormSection>
          ) : null}

          {!isLoading && currentStep === 5 ? (
            <FormSection title="FAQ" description="Adicione respostas aprovadas para as perguntas mais frequentes.">
              <Field label="FAQ aprovado" placeholder="Pergunta: ... / Resposta: ..." textarea value={form.faq} onChange={(value) => updateField("faq", value)} />
            </FormSection>
          ) : null}

          {!isLoading && currentStep === 6 ? (
            <div className="grid gap-5">
              <section className="grid gap-4">
                <FormSection title="Regras" description="Sugestoes ativas cadastradas pela matriz. Campos especificos da franquia ficam em regras adicionais.">
                  {ruleTemplates.length ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {ruleTemplates.map((rule) => (
                        <RuleBuilderCard
                          key={rule.title}
                          title={rule.title}
                          description={rule.description}
                          checked={selectedRules.includes(rule.title)}
                          onCheckedChange={(checked) => toggleRule(rule.title, checked)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Ainda nao ha textos padrao ativos para regras de atendimento.</p>
                  )}
                </FormSection>
              </section>
              <FormSection title="Regras adicionais" description="Use este campo para orientacoes especificas da operacao local.">
                <Field label="Regras complementares" placeholder="Uma regra por linha" textarea value={form.customRules} onChange={(value) => updateField("customRules", value)} />
              </FormSection>
            </div>
          ) : null}

          {!isLoading && currentStep === 7 ? (
            <FormSection title="Tom de Voz" description="Descreva como o agente deve soar nas conversas com leads e familiares.">
              {toneSuggestions.length ? (
                <div className="grid gap-3">
                  {toneSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateField("toneOfVoice", item.content)}
                      className="rounded-2xl bg-slate-50 p-4 text-left text-sm text-slate-600 transition hover:bg-slate-100"
                    >
                      <span className="font-semibold text-ink">{item.title}</span>
                      <span className="mt-2 block whitespace-pre-line leading-6">{item.content}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <Field label="Tom de voz" placeholder="Acolhedor, objetivo, consultivo e sem promessas nao validadas" textarea value={form.toneOfVoice} onChange={(value) => updateField("toneOfVoice", value)} />
            </FormSection>
          ) : null}

          {!isLoading && currentStep === 8 ? (
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="grid gap-5">
                <FormSection title="Revisao final" description="Confira todo o contexto salvo antes de gerar e publicar o agente.">
                  <div className="grid gap-4">
                    {reviewItems.map((item) => (
                      <SectionSummary key={item.title} title={item.title} content={item.content} />
                    ))}
                  </div>
                </FormSection>

                <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Publicacao</p>
                      <h2 className="mt-2 text-lg font-semibold text-ink">Publicar Agente</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        O fluxo gera o treinamento, salva o historico no banco da Vavive e envia pelo backend protegido quando houver agente conectado.
                      </p>
                    </div>
                    <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", setup?.setupStatus === "PRONTO_PARA_PUBLICAR" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                      {setup?.setupStatus?.replaceAll("_", " ") || "EM CONFIGURACAO"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-mist px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">% concluido</p>
                      <p className="mt-2 text-lg font-semibold text-ink">{setup?.completionPercentage ?? 0}%</p>
                    </div>
                    <div className="rounded-xl bg-mist px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Ultima publicacao</p>
                      <p className="mt-2 text-sm font-medium text-ink">{formatDateTime(setup?.lastPublishedAt)}</p>
                    </div>
                    <div className="rounded-xl bg-mist px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Ultimo treinamento</p>
                      <p className="mt-2 text-sm font-medium text-ink">{setup?.lastGeneratedTraining ? "Gerado" : "Ainda nao gerado"}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handlePublish()}
                    disabled={isSaving || isPublishing || !selectedFranchiseId}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Publicar Agente
                  </button>

                  {publishResult ? (
                    <div
                      className={clsx(
                        "mt-4 rounded-2xl border p-4 text-sm",
                        publishResult.success ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"
                      )}
                    >
                      <p className="font-semibold">{publishResult.success ? "Publicacao concluida" : "Publicacao nao concluida"}</p>
                      <p className="mt-2">{publishResult.message}</p>
                      <p className="mt-2">Registro da integracao: {publishResult.externalReference || "Nao retornado"}</p>
                      {!publishResult.success ? <p className="mt-2">O treinamento foi salvo localmente para nova tentativa.</p> : null}
                    </div>
                  ) : null}
                </section>
              </section>

              <TrainingPreviewCard title={previewTitle} content={previewContent} />
            </div>
          ) : null}

          {!isLoading ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-line/80 bg-white/86 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                {setup ? (
                  <>
                    Status do setup: <span className="font-semibold text-ink">{setup.setupStatus.replaceAll("_", " ")}</span> - ultima publicacao:{" "}
                    <span className="font-semibold text-ink">{formatDateTime(setup.lastPublishedAt)}</span>
                  </>
                ) : (
                  "Selecione uma franquia para iniciar."
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                  disabled={currentStep === 0 || isSaving || isPublishing}
                  className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Voltar
                </button>
                {currentStep < setupSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => void handleStepAdvance(currentStep + 1)}
                    disabled={isSaving || isPublishing || !selectedFranchiseId}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Salvar e continuar
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
