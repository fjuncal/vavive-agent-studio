"use client";

import { AppShell } from "@/components/AppShell";
import { ConversationSettings } from "@/components/ConversationSettings";
import { ToggleField, OptionCards, RichTextarea } from "@/components/FriendlyForm";
import { Field } from "@/components/FormSection";
import { IdleActionsSettings } from "@/components/IdleActionsSettings";
import { IntentionWizard, type IntentionData } from "@/components/IntentionWizard";
import { PageHeader } from "@/components/PageHeader";
import { TabConfig, type TabItem } from "@/components/TabConfig";
import { TrainingEditor, type TrainingItem } from "@/components/TrainingEditor";
import { TransferRulesSettings } from "@/components/TransferRulesSettings";
import { useToast } from "@/components/Toast";
import { WebhooksSettings } from "@/components/WebhooksSettings";
import {
  getAssistantStandardProfile,
  updateAssistantStandardBlock,
  type AssistantStandardProfile
} from "@/lib/api";
import { BookOpen, Bot, Briefcase, CheckCircle2, Plus, Settings, Sparkles, Target, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const communicationOptions = [
  { value: "FORMAL", label: "Formal", description: "Linguagem profissional e respeitosa" },
  { value: "NORMAL", label: "Normal", description: "Equilibrio entre formal e casual" },
  { value: "RELAXED", label: "Descontraida", description: "Linguagem casual e amigavel" }
];

const objectiveOptions = [
  { value: "SUPPORT", label: "Suporte", description: "Atendimento e orientacao" },
  { value: "SALE", label: "Vendas", description: "Conversao comercial" },
  { value: "PERSONAL", label: "Atendimento geral", description: "Fluxo amplo da unidade" }
];

type IdleActionPreset = {
  id?: string;
  type?: string;
  instructions?: string | null;
  seconds?: number;
  allowAllHours?: boolean;
};

type TransferRulePreset = {
  id?: string;
  instructions?: string;
  returnOnFinish?: boolean;
  type?: string;
  agentId?: string | null;
  userId?: string | null;
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asItems(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object") : [];
}

function getBlock(profile: AssistantStandardProfile | null, blockType: string) {
  return profile?.blocks.find((block) => block.blockType === blockType) ?? null;
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--color-text-tertiary)" }}>{label}</p>
          <p className="mt-1 truncate text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function trainingTitle(item: TrainingItem) {
  if (item.type === "TEXT") return item.text.slice(0, 80) || "Treinamento de texto";
  if (item.type === "WEBSITE") return item.website || "Website";
  if (item.type === "VIDEO") return item.video || "Video";
  return item.documentName || "Documento";
}

function trainingContent(item: TrainingItem) {
  if (item.type === "TEXT") return item.text || "Conteudo do treinamento";
  if (item.type === "WEBSITE") return item.website || "Website do treinamento";
  if (item.type === "VIDEO") return item.video || "Video do treinamento";
  return item.documentUrl || item.documentName || "Documento do treinamento";
}

function serializeTrainingItem(item: TrainingItem) {
  const title = trainingTitle(item);
  const content = trainingContent(item);
  return { ...item, title, content, text: item.type === "TEXT" ? item.text : undefined };
}

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || fallback;
}

function serializeIntention(intention: IntentionData, index: number) {
  const description = intention.description.trim() || `Intencao ${index + 1}`;
  return {
    ...intention,
    name: slugify(description, `intencao-${index + 1}`),
    description,
    instructions: intention.instructions.trim() || "Usar quando o pedido do cliente corresponder a esta intencao."
  };
}

function mapTrainingItems(payload: Record<string, unknown>): TrainingItem[] {
  return asItems(payload.items).map((item): TrainingItem => {
    const type = typeof item.type === "string" ? item.type : "TEXT";
    if (type === "WEBSITE") {
      return {
        type: "WEBSITE",
        website: String(item.website ?? item.content ?? ""),
        trainingSubPages: item.trainingSubPages === "ACTIVE" ? "ACTIVE" : "DISABLED",
        trainingInterval: String(item.trainingInterval ?? "ONE_WEEK")
      };
    }
    if (type === "VIDEO") {
      return { type: "VIDEO", video: String(item.video ?? item.content ?? "") };
    }
    if (type === "DOCUMENT") {
      return {
        type: "DOCUMENT",
        documentUrl: String(item.documentUrl ?? item.content ?? ""),
        documentName: String(item.documentName ?? item.title ?? "documento.pdf"),
        documentMimetype: String(item.documentMimetype ?? "application/pdf")
      };
    }
    return { type: "TEXT", text: String(item.text ?? item.content ?? "") };
  });
}

function mapIntentions(payload: Record<string, unknown>): IntentionData[] {
  return asItems(payload.items).map((item) => ({
    description: String(item.description ?? item.name ?? ""),
    instructions: String(item.instructions ?? ""),
    details: String(item.details ?? ""),
    type: item.type === "INSTRUCTIONS" ? "INSTRUCTIONS" : "WEBHOOK",
    httpMethod: ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(String(item.httpMethod))
      ? String(item.httpMethod) as IntentionData["httpMethod"]
      : "POST",
    url: String(item.url ?? ""),
    headers: Array.isArray(item.headers) ? item.headers as IntentionData["headers"] : [],
    params: Array.isArray(item.params) ? item.params as IntentionData["params"] : [],
    requestBody: String(item.requestBody ?? ""),
    fields: Array.isArray(item.fields) ? item.fields as IntentionData["fields"] : [],
    variables: Array.isArray(item.variables) ? item.variables as IntentionData["variables"] : [],
    autoGenerateParams: Boolean(item.autoGenerateParams),
    autoGenerateBody: Boolean(item.autoGenerateBody)
  }));
}

function defaultSettings(payload: Record<string, unknown>) {
  return {
    prefferModel: payload.prefferModel ?? "GPT_4_O",
    timezone: payload.timezone ?? "America/Sao_Paulo",
    enabledHumanTransfer: Boolean(payload.enabledHumanTransfer),
    enabledReminder: Boolean(payload.enabledReminder),
    splitMessages: Boolean(payload.splitMessages),
    enabledEmoji: Boolean(payload.enabledEmoji),
    signMessages: Boolean(payload.signMessages),
    limitSubjects: Boolean(payload.limitSubjects),
    knowledgeByFunction: Boolean(payload.knowledgeByFunction),
    messageGroupingTime: payload.messageGroupingTime ?? "NO_GROUP",
    maxDailyMessages: payload.maxDailyMessages ?? null,
    maxDailyMessagesLimitAction: payload.maxDailyMessagesLimitAction ?? "TRANSFER"
  };
}

export default function DefaultAgentTextsPage() {
  const { error: showError, success: showSuccess } = useToast();
  const [profile, setProfile] = useState<AssistantStandardProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showIntentionWizard, setShowIntentionWizard] = useState(false);

  const [assistantName, setAssistantName] = useState("Assistente Vavive");
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [jobName, setJobName] = useState("Assistente Vavive");
  const [jobSite, setJobSite] = useState("https://vavive.com.br");
  const [jobDescription, setJobDescription] = useState("Atendimento comercial e operacional da unidade.");
  const [behavior, setBehavior] = useState("");
  const [baseDescription, setBaseDescription] = useState("");
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [intentions, setIntentions] = useState<IntentionData[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>(defaultSettings({}));
  const [idleActions, setIdleActions] = useState<IdleActionPreset[]>([]);
  const [transferRules, setTransferRules] = useState<TransferRulePreset[]>([]);
  const [webhooks, setWebhooks] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setIsLoading(true);
    getAssistantStandardProfile()
      .then((nextProfile) => {
        setProfile(nextProfile);
        const rolePayload = asObject(getBlock(nextProfile, "ROLE")?.payload);
        const behaviorPayload = asObject(getBlock(nextProfile, "BEHAVIOR")?.payload);
        const basePayload = asObject(getBlock(nextProfile, "BASE_DESCRIPTION")?.payload);
        const trainingsPayload = asObject(getBlock(nextProfile, "TRAININGS")?.payload);
        const intentionsPayload = asObject(getBlock(nextProfile, "INTENTIONS")?.payload);
        const settingsPayload = asObject(getBlock(nextProfile, "AGENT_SETTINGS")?.payload);
        const idleActionsPayload = asObject(getBlock(nextProfile, "IDLE_ACTIONS")?.payload);
        const transferRulesPayload = asObject(getBlock(nextProfile, "TRANSFER_RULES")?.payload);

        setAssistantName(String(rolePayload.assistantName ?? "Assistente Vavive"));
        setCommunicationType(rolePayload.communicationType === "FORMAL" || rolePayload.communicationType === "RELAXED" ? rolePayload.communicationType : "NORMAL");
        setObjectiveType(rolePayload.type === "SUPPORT" || rolePayload.type === "PERSONAL" ? rolePayload.type : "SALE");
        setJobName(String(rolePayload.jobName ?? "Assistente Vavive"));
        setJobSite(String(rolePayload.jobSite ?? "https://vavive.com.br"));
        setJobDescription(String(rolePayload.description ?? "Atendimento comercial e operacional da unidade."));
        setBehavior(String(behaviorPayload.instruction ?? ""));
        setBaseDescription(String(basePayload.text ?? ""));
        setTrainings(mapTrainingItems(trainingsPayload));
        setIntentions(mapIntentions(intentionsPayload));
        setSettings(defaultSettings(settingsPayload));
        setWebhooks(asObject(settingsPayload.webhooks));
        setIdleActions(asItems(idleActionsPayload.items).map((item, index) => ({
          id: String(item.id ?? `idle-${index}`),
          type: String(item.type ?? "FINISH_INTERACTION"),
          instructions: typeof item.instructions === "string" ? item.instructions : null,
          seconds: Number(item.seconds ?? 600),
          allowAllHours: item.allowAllHours !== false
        })));
        setTransferRules(asItems(transferRulesPayload.items).map((item, index) => ({
          id: String(item.id ?? `transfer-${index}`),
          type: String(item.type ?? "HUMAN"),
          instructions: String(item.instructions ?? ""),
          returnOnFinish: item.returnOnFinish !== false,
          agentId: typeof item.agentId === "string" ? item.agentId : null,
          userId: typeof item.userId === "string" ? item.userId : null
        })));
      })
      .catch((requestError) => {
        showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o pre-setup.");
      })
      .finally(() => setIsLoading(false));
  }, [showError]);

  const handleSavePreset = useCallback(async () => {
    setIsSaving(true);
    try {
      const resolvedAssistantName = assistantName.trim() || "Assistente Vavive";
      const resolvedJobName = jobName.trim() || resolvedAssistantName;
      const resolvedBehavior = behavior.trim() || "Atender com clareza, objetividade e foco na melhor proxima acao para o cliente.";
      const resolvedBaseDescription = baseDescription.trim() || jobDescription.trim() || "Base padrao do assistente da matriz.";

      const rolePayload = {
        ...asObject(getBlock(profile, "ROLE")?.payload),
        assistantName: resolvedAssistantName,
        communicationType,
        type: objectiveType,
        jobName: resolvedJobName,
        jobSite: jobSite.trim(),
        description: jobDescription.trim()
      };
      const behaviorPayload = {
        ...asObject(getBlock(profile, "BEHAVIOR")?.payload),
        instruction: resolvedBehavior,
        summary: resolvedBehavior.slice(0, 200)
      };
      const settingsPayload = {
        ...asObject(getBlock(profile, "AGENT_SETTINGS")?.payload),
        ...defaultSettings(settings),
        webhooks
      };

      let nextProfile = await updateAssistantStandardBlock("ROLE", rolePayload);
      nextProfile = await updateAssistantStandardBlock("BEHAVIOR", behaviorPayload);
      nextProfile = await updateAssistantStandardBlock("BASE_DESCRIPTION", { text: resolvedBaseDescription });
      nextProfile = await updateAssistantStandardBlock("TRAININGS", { items: trainings.map(serializeTrainingItem) });
      nextProfile = await updateAssistantStandardBlock("INTENTIONS", { items: intentions.map(serializeIntention) });
      nextProfile = await updateAssistantStandardBlock("AGENT_SETTINGS", settingsPayload);
      nextProfile = await updateAssistantStandardBlock("IDLE_ACTIONS", { items: idleActions.map(({ id, ...item }) => item) });
      nextProfile = await updateAssistantStandardBlock("TRANSFER_RULES", { items: transferRules.map(({ id, ...item }) => item) });

      setProfile(nextProfile);
      showSuccess("Pre-setup do assistente salvo.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar o pre-setup.");
    } finally {
      setIsSaving(false);
    }
  }, [
    assistantName,
    baseDescription,
    behavior,
    communicationType,
    idleActions,
    intentions,
    jobDescription,
    jobName,
    jobSite,
    objectiveType,
    profile,
    settings,
    showError,
    showSuccess,
    trainings,
    transferRules,
    webhooks
  ]);

  const tabs: TabItem[] = [
    {
      id: "profile",
      label: "Perfil",
      icon: <Bot size={16} />,
      content: (
        <div className="space-y-6">
          <Field label="Nome padrao do assistente" value={assistantName} onChange={setAssistantName} required />
          <OptionCards
            label="Comunicacao"
            description="Como o assistente fala por padrao"
            value={communicationType}
            onChange={(value) => setCommunicationType(value as typeof communicationType)}
            options={communicationOptions}
          />
          <OptionCards
            label="Objetivo"
            description="Finalidade principal herdada pelo franqueado"
            value={objectiveType}
            onChange={(value) => setObjectiveType(value as typeof objectiveType)}
            options={objectiveOptions}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Produto ou nome do negocio" value={jobName} onChange={setJobName} />
            <Field label="Site oficial" value={jobSite} onChange={setJobSite} />
          </div>
          <RichTextarea label="Descricao padrao da operacao" value={jobDescription} onChange={setJobDescription} rows={4} />
        </div>
      )
    },
    {
      id: "personality",
      label: "Personalidade",
      icon: <Sparkles size={16} />,
      content: (
        <div className="space-y-6">
          <RichTextarea
            label="Comportamento"
            placeholder="Descreva como o agente deve se comportar durante a conversa..."
            value={behavior}
            onChange={setBehavior}
            rows={6}
          />
          <RichTextarea
            label="Descricao base"
            placeholder="Contexto base usado para orientar o assistente..."
            value={baseDescription}
            onChange={setBaseDescription}
            rows={5}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <ToggleField label="Usar emojis" checked={Boolean(settings.enabledEmoji)} onChange={(value) => setSettings((current) => ({ ...current, enabledEmoji: value }))} />
            <ToggleField label="Assinar mensagens" checked={Boolean(settings.signMessages)} onChange={(value) => setSettings((current) => ({ ...current, signMessages: value }))} />
            <ToggleField label="Limitar assuntos" checked={Boolean(settings.limitSubjects)} onChange={(value) => setSettings((current) => ({ ...current, limitSubjects: value }))} />
          </div>
        </div>
      )
    },
    {
      id: "trainings",
      label: "Treinamentos",
      icon: <BookOpen size={16} />,
      badge: String(trainings.length),
      content: <TrainingEditor items={trainings} onChange={setTrainings} />
    },
    {
      id: "intentions",
      label: "Intencoes",
      icon: <Target size={16} />,
      badge: String(intentions.length),
      content: (
        <div className="space-y-6">
          {intentions.length > 0 ? (
            <div className="space-y-3">
              {intentions.map((intent, index) => (
                <div key={`${intent.description}-${index}`} className="card p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{intent.description || `Intencao ${index + 1}`}</p>
                    {intent.instructions ? <p className="mt-1 text-sm line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{intent.instructions}</p> : null}
                  </div>
                  <button type="button" onClick={() => setIntentions((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-sm text-rose-500 hover:text-rose-700">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-6 text-center">
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma intencao padrao cadastrada.</p>
            </div>
          )}

          {!showIntentionWizard ? (
            <button type="button" onClick={() => setShowIntentionWizard(true)} className="btn-primary">
              <Plus size={16} />
              Adicionar intencao
            </button>
          ) : (
            <div className="card p-6">
              <IntentionWizard
                onSave={(data) => {
                  setIntentions((current) => [...current, data]);
                  setShowIntentionWizard(false);
                }}
                onCancel={() => setShowIntentionWizard(false)}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: "settings",
      label: "Configuracoes",
      icon: <Settings size={16} />,
      content: (
        <TabConfig
          tabs={[
            {
              id: "conversation",
              label: "Conversa",
              content: (
                <ConversationSettings
                  settings={settings}
                  onChange={setSettings}
                  onSave={async () => undefined}
                  isSaving={isSaving}
                  showSaveButton={false}
                />
              )
            },
            {
              id: "idle-actions",
              label: "Acoes de Inatividade",
              badge: String(idleActions.length),
              content: (
                <IdleActionsSettings
                  actions={idleActions}
                  onCreate={async (payload) => setIdleActions((current) => [...current, { id: crypto.randomUUID(), ...payload }])}
                  onUpdate={async (actionId, payload) => setIdleActions((current) => current.map((item) => item.id === actionId ? { ...item, ...payload } : item))}
                  onDelete={async (actionId) => setIdleActions((current) => current.filter((item) => item.id !== actionId))}
                  isSaving={isSaving}
                />
              )
            },
            {
              id: "webhooks",
              label: "Webhooks",
              content: (
                <WebhooksSettings
                  webhooks={webhooks}
                  onChange={setWebhooks}
                  onSave={async () => undefined}
                  isSaving={isSaving}
                  showSaveButton={false}
                />
              )
            },
            {
              id: "transfer-rules",
              label: "Regras de Transferencia",
              badge: String(transferRules.length),
              content: (
                <TransferRulesSettings
                  rules={transferRules}
                  onCreate={async (payload) => setTransferRules((current) => [...current, { id: crypto.randomUUID(), ...payload }])}
                  onUpdate={async (ruleId, payload) => setTransferRules((current) => current.map((item) => item.id === ruleId ? { ...item, ...payload } : item))}
                  onDelete={async (ruleId) => setTransferRules((current) => current.filter((item) => item.id !== ruleId))}
                  isSaving={isSaving}
                />
              )
            }
          ]}
          defaultTab="conversation"
        />
      )
    }
  ];

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader eyebrow="Matriz" title="Pre-setup do Assistente" />
        <section className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando...</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Matriz"
        title="Pre-setup do Assistente"
        description="Configure o agente padrao da matriz. As franquias recebem esses campos preenchidos e podem editar antes de criar."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <SummaryCard icon={<Bot size={18} />} label="Agente" value={assistantName || "Sem nome"} />
        <SummaryCard icon={<Briefcase size={18} />} label="Objetivo" value={objectiveOptions.find((item) => item.value === objectiveType)?.label ?? objectiveType} />
        <SummaryCard icon={<BookOpen size={18} />} label="Treinamentos" value={String(trainings.length)} />
        <SummaryCard icon={<Target size={18} />} label="Intencoes" value={String(intentions.length)} />
      </div>

      <section className="card p-6">
        <TabConfig tabs={tabs} defaultTab="profile" />
      </section>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {profile?.updatedAt ? `Ultima atualizacao: ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(profile.updatedAt))}` : "Padrao pronto para salvar."}
        </div>
        <button type="button" onClick={() => void handleSavePreset()} disabled={isSaving} className="btn-primary">
          <CheckCircle2 size={16} />
          {isSaving ? "Salvando..." : "Salvar pre-setup"}
        </button>
      </div>
    </AppShell>
  );
}
