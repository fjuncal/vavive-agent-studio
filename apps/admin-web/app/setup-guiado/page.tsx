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

const setupSteps = ["Escolher franquia", "Dados da franquia", "Textos padrão", "Serviços e regiões", "Regras de atendimento", "Revisão"];

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

function splitRules(rawRules: string | null | undefined) {
  const lines = normalizeValue(rawRules)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const customRules = lines.join("\n");
  return { customRules };
}

function toFormState(setup: FranchiseSetup): SetupFormState {
  const parsedRules = splitRules(setup.rules);
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

function buildRulesPayload(customRules: string) {
  return customRules;
}

function buildTrainingPreview(form: SetupFormState) {
  const sections = [
    "TREINAMENTO VAVIVE",
    "",
    `FRANQUIA: ${form.franchiseName || "Não informado"}`,
    `RESPONSÁVEL: ${form.responsibleName || "Não informado"}`,
    `LOCALIZAÇÃO: ${[form.city, form.state].filter(Boolean).join(" / ") || "Não informado"}`,
    "",
    "SERVIÇOS:",
    form.services || "Não informado",
    "",
    "PREÇOS:",
    form.prices || "Não informado",
    "",
    "REGIÕES ATENDIDAS:",
    form.regions || "Não informado",
    "",
    "HORÁRIOS:",
    form.schedules || "Não informado",
    "",
    "PERGUNTAS FREQUENTES:",
    form.faq || "Não informado",
    "",
    "REGRAS DO AGENTE:",
    buildRulesPayload(form.customRules) || "Não informado",
    "",
    "TOM DE VOZ:",
    form.toneOfVoice || "Não informado",
    "",
    "ORIENTAÇÃO:",
    "Nunca invente informações. Quando faltar contexto, colete os dados ou transfira para a equipe."
  ];

  return sections.join("\n");
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Ainda não publicado";
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
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{content || "Não informado"}</p>
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
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishAgentResult | null>(null);

  const progressLabel = setup ? `${setup.completionPercentage}% concluído - ${setup.setupStatus.replaceAll("_", " ")}` : "Carregando";
  const previewTitle = useMemo(() => `Treinamento ${form.franchiseName || "Vavive"}`, [form.franchiseName]);
  const previewContent = useMemo(() => setup?.lastGeneratedTraining || buildTrainingPreview(form), [form, setup?.lastGeneratedTraining]);

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
        setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as franquias.");
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => {
    getDefaultAgentTexts()
      .then((items) => setDefaultTexts(items.filter((item) => item.active)))
      .catch(() => setDefaultTexts([]));
  }, []);

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
        setForm(toFormState(response));
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar a configuração.");
      })
      .finally(() => setIsLoading(false));
  }, [selectedFranchiseId]);

  function updateField<K extends keyof SetupFormState>(field: K, value: SetupFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
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
      rules: buildRulesPayload(form.customRules),
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
      setForm(toFormState(response));
      setSuccessMessage("Etapa salva.");
      return response;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível salvar.");
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
      if (result.success) {
        setSuccessMessage("Agente publicado com sucesso.");
      }
      const refreshedSetup = await getFranchiseSetup(selectedFranchiseId);
      setSetup(refreshedSetup);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível publicar.");
    } finally {
      setIsPublishing(false);
    }
  }

  const reviewItems = [
    { title: "Franquia", content: [form.franchiseName, form.document, [form.city, form.state].filter(Boolean).join(" / "), form.responsibleName].filter(Boolean).join("\n") },
    { title: "Serviços", content: form.services },
    { title: "Preços", content: form.prices },
    { title: "Regiões", content: form.regions },
    { title: "Horários", content: form.schedules },
    { title: "FAQ", content: form.faq },
    { title: "Regras", content: buildRulesPayload(form.customRules) },
    { title: "Tom de voz", content: form.toneOfVoice }
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Configuração"
        title="Configuração do agente"
        description="Configure os dados da franquia, revise e gere o treinamento do agente."
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
          completed={setup ? setupSteps.map((_, index) => (index < Math.floor((setup.completionPercentage / 100) * (setupSteps.length - 1)) ? index : -1)).filter((index) => index >= 0) : []}
          progressLabel={progressLabel}
          onStepClick={(index) => {
            if (isSaving || isPublishing) {
              return;
            }
            void handleStepAdvance(index);
          }}
        />

        <div className="grid gap-5">
          <FormSection title="Franquia" description="Selecione a franquia para configurar o agente.">
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
                Carregando...
              </div>
            </section>
          ) : null}

          {!isLoading && currentStep === 1 ? (
            <FormSection title="Dados da franquia" description="Informações oficiais usadas no treinamento do agente.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome comercial" placeholder="Vavive Vila Mariana" value={form.franchiseName} onChange={(value) => updateField("franchiseName", value)} />
                <Field label="Responsável" placeholder="Gestor da unidade" value={form.responsibleName} onChange={(value) => updateField("responsibleName", value)} />
                <Field label="Documento" placeholder="CNPJ da franquia" value={form.document} onChange={(value) => updateField("document", value)} />
                <Field label="Cidade" placeholder="São Paulo" value={form.city} onChange={(value) => updateField("city", value)} />
                <Field label="Estado" placeholder="SP" value={form.state} onChange={(value) => updateField("state", value)} />
              </div>
            </FormSection>
          ) : null}

          {!isLoading && currentStep === 2 ? (
            <FormSection title="Textos padrão" description="Textos cadastrados pela administração para orientar o agente.">
              {defaultTexts.length ? (
                <div className="grid gap-3">
                  {defaultTexts.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-line/80 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">{item.category.replaceAll("_", " ")}</p>
                          <h3 className="mt-1 font-semibold text-ink">{item.title}</h3>
                        </div>
                        {item.category === "TOM_DE_VOZ" ? (
                          <button type="button" onClick={() => updateField("toneOfVoice", item.content)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                            Usar tom
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.content}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Nenhum texto padrão ativo.</p>
              )}
            </FormSection>
          ) : null}

          {!isLoading && currentStep === 3 ? (
            <FormSection title="Serviços e regiões" description="Informações comerciais da franquia para o agente.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Serviços oferecidos" placeholder="Cuidador por hora, plantão noturno..." textarea value={form.services} onChange={(value) => updateField("services", value)} />
                <Field label="Preços" placeholder="Faixas de preço e condições" textarea value={form.prices} onChange={(value) => updateField("prices", value)} />
                <Field label="Regiões atendidas" placeholder="Bairros, cidades atendidas" textarea value={form.regions} onChange={(value) => updateField("regions", value)} />
                <Field label="Horários" placeholder="Horário de funcionamento" textarea value={form.schedules} onChange={(value) => updateField("schedules", value)} />
                <Field label="Perguntas frequentes" placeholder="Pergunta e resposta" textarea value={form.faq} onChange={(value) => updateField("faq", value)} />
                <Field label="Tom de voz" placeholder="Acolhedor, consultivo..." textarea value={form.toneOfVoice} onChange={(value) => updateField("toneOfVoice", value)} />
              </div>
            </FormSection>
          ) : null}

          {!isLoading && currentStep === 4 ? (
            <div className="grid gap-5">
              <FormSection title="Regras de atendimento" description="Defina como o agente deve se comportar.">
                {defaultTexts.filter((t) => t.category === "REGRAS_ATENDIMENTO").length ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {defaultTexts.filter((t) => t.category === "REGRAS_ATENDIMENTO").map((rule) => (
                      <RuleBuilderCard
                        key={rule.id}
                        title={rule.title}
                        description={rule.content}
                        checked={form.customRules.includes(rule.title)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateField("customRules", form.customRules ? `${form.customRules}\n${rule.title}` : rule.title);
                          } else {
                            updateField("customRules", form.customRules.split("\n").filter((l) => l.trim() !== rule.title).join("\n"));
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Nenhuma regra cadastrada.</p>
                )}
              </FormSection>
              <FormSection title="Regras adicionais" description="Regras específicas da operação local.">
                <Field label="Regras" placeholder="Uma regra por linha" textarea value={form.customRules} onChange={(value) => updateField("customRules", value)} />
              </FormSection>
            </div>
          ) : null}

          {!isLoading && currentStep >= 5 ? (
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="grid gap-5">
                <FormSection title="Revisão final" description="Confira todos os dados antes de gerar o treinamento.">
                  <div className="grid gap-4">
                    {reviewItems.map((item) => (
                      <SectionSummary key={item.title} title={item.title} content={item.content} />
                    ))}
                  </div>
                </FormSection>

                <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Publicação</p>
                      <h2 className="mt-2 text-lg font-semibold text-ink">Gerar treinamento</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Gera o treinamento e envia para configurar o agente.
                      </p>
                    </div>
                    <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", setup?.setupStatus === "PRONTO_PARA_PUBLICAR" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                      {setup?.setupStatus?.replaceAll("_", " ") || "EM CONFIGURAÇÃO"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-mist px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">% concluído</p>
                      <p className="mt-2 text-lg font-semibold text-ink">{setup?.completionPercentage ?? 0}%</p>
                    </div>
                    <div className="rounded-xl bg-mist px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Última publicação</p>
                      <p className="mt-2 text-sm font-medium text-ink">{formatDateTime(setup?.lastPublishedAt)}</p>
                    </div>
                    <div className="rounded-xl bg-mist px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Último treinamento</p>
                      <p className="mt-2 text-sm font-medium text-ink">{setup?.lastGeneratedTraining ? "Gerado" : "Não gerado"}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handlePublish()}
                    disabled={isSaving || isPublishing || !selectedFranchiseId}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Gerar treinamento
                  </button>

                  {publishResult ? (
                    <div
                      className={clsx(
                        "mt-4 rounded-2xl border p-4 text-sm",
                        publishResult.success ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"
                      )}
                    >
                      <p className="font-semibold">{publishResult.success ? "Concluído" : "Não concluído"}</p>
                      <p className="mt-2">{publishResult.message}</p>
                      {!publishResult.success ? <p className="mt-2">O treinamento foi salvo para nova tentativa.</p> : null}
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
                    Status: <span className="font-semibold text-ink">{setup.setupStatus.replaceAll("_", " ")}</span>
                  </>
                ) : (
                  "Selecione uma franquia."
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
