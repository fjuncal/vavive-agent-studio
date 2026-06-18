"use client";

import { AppShell } from "@/components/AppShell";
import { Field, FormSection } from "@/components/FormSection";
import { PageHeader } from "@/components/PageHeader";
import { Stepper } from "@/components/Stepper";
import { TrainingPreviewCard } from "@/components/TrainingPreviewCard";
import { useAuth } from "@/lib/auth";
import {
  createConversationExample,
  getDefaultAgentTexts,
  getFranchiseSetup,
  getFranchises,
  publishFranchiseAgent,
  saveFranchiseSetup,
  updateConversationExample,
  type ConversationExample,
  type DefaultAgentText,
  type FranchiseSetup,
  type FranchiseSummary,
  type PublishAgentResult,
  type UpdateFranchiseSetupPayload
} from "@/lib/api";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Save, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const steps = ["Dados", "Personalizacao", "Exemplos", "Revisao"];

type SetupFormState = {
  franchiseName: string;
  document: string;
  city: string;
  state: string;
  responsibleName: string;
  franchiseWhatsapp: string;
  services: string;
  prices: string;
  regions: string;
  schedules: string;
  faq: string;
  rules: string;
  toneOfVoice: string;
};

const emptyForm: SetupFormState = {
  franchiseName: "",
  document: "",
  city: "",
  state: "",
  responsibleName: "",
  franchiseWhatsapp: "",
  services: "",
  prices: "",
  regions: "",
  schedules: "",
  faq: "",
  rules: "",
  toneOfVoice: ""
};

function toFormState(setup: FranchiseSetup): SetupFormState {
  return {
    franchiseName: setup.franchiseName || "",
    document: setup.document || "",
    city: setup.city || "",
    state: setup.state || "",
    responsibleName: setup.responsibleName || "",
    franchiseWhatsapp: setup.franchiseWhatsapp || "",
    services: setup.services || "",
    prices: setup.prices || "",
    regions: setup.regions || "",
    schedules: setup.schedules || "",
    faq: setup.faq || "",
    rules: setup.rules || "",
    toneOfVoice: setup.toneOfVoice || ""
  };
}

function ExampleCard({
  example,
  onSave
}: {
  example: ConversationExample | Omit<ConversationExample, "id" | "createdAt" | "updatedAt">;
  onSave: (payload: { title: string; objective: string; messages: string; includeInTraining: boolean; status: string }) => void;
}) {
  const [title, setTitle] = useState(example.title || "");
  const [objective, setObjective] = useState(example.objective || "");
  const [messages, setMessages] = useState(example.messages || "");
  const [status, setStatus] = useState(example.status || "RASCUNHO");
  const [includeInTraining, setIncludeInTraining] = useState(example.includeInTraining);

  return (
    <div className="card p-4">
      <div className="grid gap-3">
        <input className="input-field" style={{ color: "var(--color-text-primary)" }} placeholder="Titulo do exemplo" value={title} onChange={(event) => setTitle(event.target.value)} />
        <input className="input-field" style={{ color: "var(--color-text-primary)" }} placeholder="Objetivo do exemplo" value={objective} onChange={(event) => setObjective(event.target.value)} />
        <textarea className="input-field min-h-[140px]" style={{ color: "var(--color-text-primary)" }} placeholder={"Cliente: ...\nAgente: ..."} value={messages} onChange={(event) => setMessages(event.target.value)} />
        <div className="flex flex-wrap items-center gap-3">
          <select className="input-field" style={{ color: "var(--color-text-primary)" }} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="RASCUNHO">Rascunho</option>
            <option value="PUBLICAR">Publicar</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <input type="checkbox" checked={includeInTraining} onChange={(event) => setIncludeInTraining(event.target.checked)} />
            Incluir no treinamento
          </label>
          <button type="button" onClick={() => onSave({ title, objective, messages, includeInTraining, status })} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
            <Save size={16} />
            Salvar exemplo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuidedSetupPage() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [setup, setSetup] = useState<FranchiseSetup | null>(null);
  const [form, setForm] = useState<SetupFormState>(emptyForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishAgentResult | null>(null);
  const [defaultTexts, setDefaultTexts] = useState<DefaultAgentText[]>([]);

  useEffect(() => {
    getDefaultAgentTexts()
      .then((items) => setDefaultTexts(items.filter((t) => t.active)))
      .catch(() => setDefaultTexts([]));
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    getFranchises()
      .then((items) => {
        setFranchises(items);
        const defaultId = user.role === "ADMIN_FRANQUIA" ? user.franchise?.id : items[0]?.id;
        if (defaultId) {
          setSelectedFranchiseId((current) => current || defaultId);
        }
      })
      .catch(() => setFranchises([]));
  }, [user]);

  useEffect(() => {
    if (!selectedFranchiseId) {
      return;
    }
    setIsLoading(true);
    setError(null);
    getFranchiseSetup(selectedFranchiseId)
      .then((response) => {
        setSetup(response);
        setForm(toFormState(response));
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar workbench."))
      .finally(() => setIsLoading(false));
  }, [selectedFranchiseId]);

  const preview = useMemo(() => {
    return [
      "CONTEXTO BASE",
      setup?.defaultContext || "-",
      "",
      "PERSONALIZACAO LOCAL",
      `Franquia: ${form.franchiseName}`,
      `Responsavel: ${form.responsibleName}`,
      `WhatsApp franqueado: ${form.franchiseWhatsapp || "-"}`,
      "",
      "SERVICOS",
      form.services || "-",
      "",
      "REGRAS",
      form.rules || "-",
      "",
      "EXEMPLOS",
      setup?.examples?.filter((item) => item.includeInTraining).map((item) => `${item.title}: ${item.objective || "-"}`).join("\n") || "-"
    ].join("\n");
  }, [form, setup]);

  function updateField<K extends keyof SetupFormState>(field: K, value: SetupFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateStep(step: number): string | null {
    if (step === 0) {
      if (!form.franchiseName.trim()) return "Nome da franquia e obrigatorio.";
      if (!form.responsibleName.trim()) return "Responsavel e obrigatorio.";
    }
    return null;
  }

  function goToStep(step: number) {
    if (step < 0 || step >= steps.length) return;
    // Allow navigating back freely, validate only when going forward past current
    if (step > currentStep) {
      const validationError = validateStep(currentStep);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setError(null);
    setCurrentStep(step);
  }

  function buildPayload(): UpdateFranchiseSetupPayload {
    return {
      franchiseName: form.franchiseName,
      document: form.document,
      city: form.city,
      state: form.state,
      responsibleName: form.responsibleName,
      franchiseWhatsapp: form.franchiseWhatsapp,
      services: form.services,
      prices: form.prices,
      regions: form.regions,
      schedules: form.schedules,
      faq: form.faq,
      rules: form.rules,
      toneOfVoice: form.toneOfVoice
    };
  }

  async function persistSetup() {
    if (!selectedFranchiseId) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await saveFranchiseSetup(selectedFranchiseId, buildPayload());
      setSetup(response);
      setForm(toFormState(response));
      setSuccess("Workbench salvo.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    if (!selectedFranchiseId) {
      return;
    }
    setIsPublishing(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await publishFranchiseAgent(selectedFranchiseId);
      setPublishResult(result);
      setSuccess(result.success ? "Treinamento publicado." : result.message);
      const refreshed = await getFranchiseSetup(selectedFranchiseId);
      setSetup(refreshed);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel publicar.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleSaveExample(exampleId: string | null, payload: { title: string; objective: string; messages: string; includeInTraining: boolean; status: string }) {
    if (!setup?.agentId) {
      setError("Agente da franquia ainda nao configurado.");
      return;
    }
    setError(null);
    try {
      if (exampleId) {
        await updateConversationExample(setup.agentId, exampleId, payload);
      } else {
        await createConversationExample(setup.agentId, payload);
      }
      const refreshed = await getFranchiseSetup(selectedFranchiseId);
      setSetup(refreshed);
      setSuccess("Exemplo salvo.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar exemplo.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Configuracao"
        title="Workbench do agente"
        description="Contexto base, personalizacao local, exemplos de conversa e publicacao auditavel."
      />

      {error ? <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-400">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">{success}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Stepper
          steps={steps}
          current={currentStep}
          completed={setup ? steps.map((_, index) => index < Math.floor((setup.completionPercentage / 100) * steps.length) ? index : -1).filter((index) => index >= 0) : []}
          progressLabel={setup ? `${setup.completionPercentage}% - ${setup.setupStatus.replaceAll("_", " ")}` : "Carregando"}
          onStepClick={(index) => goToStep(index)}
        />

        <div className="grid gap-5">
          {user?.role !== "ADMIN_FRANQUIA" ? (
            <FormSection title="Franquia" description="Selecione a franquia para trabalhar no agente.">
              <select
                className="input-field"
                style={{ color: "var(--color-text-primary)" }}
                value={selectedFranchiseId}
                onChange={(event) => setSelectedFranchiseId(event.target.value)}
              >
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>{franchise.name}</option>
                ))}
              </select>
            </FormSection>
          ) : null}

          {isLoading ? (
            <section className="card p-6">
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando workbench...</p>
            </section>
          ) : null}

          {!isLoading && currentStep === 0 ? (
            <>
              <FormSection title="Dados operacionais" description="Informacoes locais da franquia usadas no atendimento e no handoff.">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nome da franquia" value={form.franchiseName} onChange={(value) => updateField("franchiseName", value)} />
                  <Field label="Responsavel" value={form.responsibleName} onChange={(value) => updateField("responsibleName", value)} />
                  <Field label="Documento" value={form.document} onChange={(value) => updateField("document", value)} />
                  <Field label="Cidade" value={form.city} onChange={(value) => updateField("city", value)} />
                  <Field label="Estado" value={form.state} onChange={(value) => updateField("state", value)} />
                  <Field label="WhatsApp do franqueado" value={form.franchiseWhatsapp} onChange={(value) => updateField("franchiseWhatsapp", value)} />
                </div>
              </FormSection>
              <div className="flex justify-end">
                <button type="button" onClick={() => goToStep(1)} className="btn-primary inline-flex items-center gap-2">
                  Proximo
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          ) : null}

          {!isLoading && currentStep === 1 ? (
            <div className="grid gap-5">
              <FormSection title="Contexto base da matriz" description="Texto global atualmente ativo na matriz.">
                <div className="rounded-2xl p-4 text-sm leading-7 whitespace-pre-line" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
                  {setup?.defaultContext || "Sem contexto global ativo."}
                </div>
              </FormSection>
              <FormSection title="Personalizacao local" description="Informacoes proprias da franquia para o agente.">
                <div className="grid gap-4">
                  <Field label="Servicos" textarea value={form.services} onChange={(value) => updateField("services", value)} />
                  <Field label="Precos" textarea value={form.prices} onChange={(value) => updateField("prices", value)} />
                  <Field label="Regioes atendidas" textarea value={form.regions} onChange={(value) => updateField("regions", value)} />
                  <Field label="Horarios" textarea value={form.schedules} onChange={(value) => updateField("schedules", value)} />
                  <Field label="FAQ" textarea value={form.faq} onChange={(value) => updateField("faq", value)} />
                  <Field label="Regras locais" textarea value={form.rules} onChange={(value) => updateField("rules", value)} />
                  <Field label="Tom de voz" textarea value={form.toneOfVoice} onChange={(value) => updateField("toneOfVoice", value)} />
                </div>
              </FormSection>
              {defaultTexts.length > 0 ? (
                <FormSection title="Textos padrao da matriz" description="Referencias globais ativas. Use como base para personalizacao local.">
                  <div className="grid gap-5">
                    {(["CONTEXTO_VAVIVE", "REGRAS_ATENDIMENTO", "TOM_DE_VOZ", "SERVICOS", "FAQ", "RESTRICOES"] as const).map((cat) => {
                      const items = defaultTexts.filter((t) => t.category === cat);
                      if (items.length === 0) return null;
                      const labels: Record<string, string> = {
                        CONTEXTO_VAVIVE: "Contexto Vavive",
                        REGRAS_ATENDIMENTO: "Regras de Atendimento",
                        TOM_DE_VOZ: "Tom de Voz",
                        SERVICOS: "Servicos",
                        FAQ: "FAQ",
                        RESTRICOES: "Restricoes"
                      };
                      return (
                        <div key={cat}>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
                            {labels[cat] || cat}
                          </h4>
                          <div className="grid gap-3">
                            {items.map((item) => (
                              <div key={item.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
                                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
                                <p className="mt-1 whitespace-pre-line text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>{item.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </FormSection>
              ) : null}
              <div className="flex justify-between">
                <button type="button" onClick={() => goToStep(0)} className="btn-secondary inline-flex items-center gap-2">
                  <ChevronLeft size={16} />
                  Voltar
                </button>
                <button type="button" onClick={() => goToStep(2)} className="btn-primary inline-flex items-center gap-2">
                  Proximo
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}

          {!isLoading && currentStep === 2 ? (
            <div className="grid gap-5">
              <FormSection title="Exemplos de conversa" description="Exemplos rastreaveis para treino do agente.">
                <div className="grid gap-4">
                  {setup?.examples?.map((example) => (
                    <ExampleCard key={example.id} example={example} onSave={(payload) => void handleSaveExample(example.id, payload)} />
                  ))}
                  <ExampleCard
                    example={{ title: "", objective: "", messages: "", status: "RASCUNHO", includeInTraining: true }}
                    onSave={(payload) => void handleSaveExample(null, payload)}
                  />
                </div>
              </FormSection>
              <div className="flex justify-between">
                <button type="button" onClick={() => goToStep(1)} className="btn-secondary inline-flex items-center gap-2">
                  <ChevronLeft size={16} />
                  Voltar
                </button>
                <button type="button" onClick={() => goToStep(3)} className="btn-primary inline-flex items-center gap-2">
                  Proximo
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}

          {!isLoading && currentStep === 3 ? (
            <div className="grid gap-5">
              <div className="flex justify-start">
                <button type="button" onClick={() => goToStep(2)} className="btn-secondary inline-flex items-center gap-2">
                  <ChevronLeft size={16} />
                  Voltar
                </button>
              </div>
              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="grid gap-5">
                <FormSection title="Revisao e publicacao" description="Confira base global, customizacao e historico antes de publicar.">
                  <div className="grid gap-3">
                    <div className="rounded-2xl p-4 text-sm" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
                      <p><strong style={{ color: "var(--color-text-primary)" }}>Setup:</strong> {setup?.setupStatus.replaceAll("_", " ")}</p>
                      <p className="mt-2"><strong style={{ color: "var(--color-text-primary)" }}>Ultima publicacao:</strong> {setup?.lastPublishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(setup.lastPublishedAt)) : "Nunca publicada"}</p>
                    </div>

                    <div className="rounded-2xl p-4 text-sm" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Treinamentos recentes</p>
                      {setup?.recentTrainings?.length ? (
                        <div className="mt-3 grid gap-3">
                          {setup.recentTrainings.map((training) => (
                            <div key={training.id} className="card px-3 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{training.title}</p>
                                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{training.contentSummary || training.message || "Sem resumo"}</p>
                                </div>
                                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3">Nenhum treinamento salvo.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => void persistSetup()} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold ring-1 ring-line dark:ring-slate-700 disabled:opacity-60" style={{ color: "var(--color-text-secondary)" }}>
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar workbench
                      </button>
                      <button type="button" onClick={() => void handlePublish()} disabled={isPublishing} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                        {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Publicar treinamento
                      </button>
                    </div>

                    {publishResult ? (
                      <div className={`rounded-2xl border p-4 text-sm ${publishResult.success ? "border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400" : "border-rose-100 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400"}`}>
                        {publishResult.message}
                      </div>
                    ) : null}
                  </div>
                </FormSection>
              </section>
              <TrainingPreviewCard title={`Workbench - ${form.franchiseName || "Franquia"}`} content={preview} />
            </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
