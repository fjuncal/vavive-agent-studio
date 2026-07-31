"use client";

import { AppShell } from "@/components/AppShell";
import { ConversationSettings } from "@/components/ConversationSettings";
import { Field } from "@/components/FormSection";
import { IdleActionsSettings } from "@/components/IdleActionsSettings";
import { IntentionWizard, type IntentionData } from "@/components/IntentionWizard";
import { OptionCards, RichTextarea } from "@/components/FriendlyForm";
import { PageHeader } from "@/components/PageHeader";
import { TabConfig, type TabItem } from "@/components/TabConfig";
import { TrainingEditor, type TrainingItem } from "@/components/TrainingEditor";
import { TransferRulesSettings } from "@/components/TransferRulesSettings";
import { useToast } from "@/components/Toast";
import { WebhooksSettings } from "@/components/WebhooksSettings";
import {
  createGptMakerIntention,
  createGptMakerTraining,
  createIdleAction,
  createTransferRule,
  deleteGptMakerAgent,
  getFranchiseAssistantConfiguration,
  getFranchiseById,
  getFranchiseGptMakerConnection,
  getAgentSettings,
  provisionFranchiseGptMakerAgent,
  updateAgentSettings,
  updateAgentWebhooks,
  type FranchiseAssistantConfiguration,
  type FranchiseGptMakerConnection,
  type FranchiseSummary
} from "@/lib/api";
import { BookOpen, Bot, Briefcase, CheckCircle2, Plus, Settings, Target, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const communicationOptions = [
  { value: "FORMAL", label: "Formal", description: "Mais institucional" },
  { value: "NORMAL", label: "Normal", description: "Equilibrado" },
  { value: "RELAXED", label: "Relaxado", description: "Mais proximo e leve" }
];

const objectiveOptions = [
  { value: "SALE", label: "Vendas", description: "Conduzir fechamento" },
  { value: "SUPPORT", label: "Suporte", description: "Resolver duvidas" },
  { value: "PERSONAL", label: "Atendimento geral", description: "Fluxo amplo da unidade" }
];

type IdleActionDraft = {
  id?: string;
  type?: string;
  instructions?: string | null;
  seconds?: number;
  allowAllHours?: boolean;
};

type TransferRuleDraft = {
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

function getBlock(configuration: FranchiseAssistantConfiguration | null, blockType: string) {
  return configuration?.blocks.find((block) => block.blockType === blockType) ?? null;
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

function trainingPayload(item: TrainingItem) {
  if (item.type === "TEXT") return { type: "TEXT", text: item.text };
  return item as unknown as Record<string, unknown>;
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

function intentionPayload(intention: IntentionData, index: number) {
  const description = intention.description.trim() || `Intencao ${index + 1}`;
  return {
    ...intention,
    name: slugify(description, `intencao-${index + 1}`),
    description,
    instructions: intention.instructions.trim() || "Usar quando o pedido do cliente corresponder a esta intencao."
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRemoteAgentReadiness(franchiseId: string) {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await getAgentSettings(franchiseId);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Nao foi possivel validar o agente criado.");
      await sleep(750 * (attempt + 1));
    }
  }
  throw lastError ?? new Error("O agente foi criado, mas ainda nao ficou disponivel no GPTMaker para sincronizacao.");
}

async function syncStep(label: string, action: () => Promise<unknown>, failures: string[]) {
  try {
    await action();
  } catch (error) {
    failures.push(error instanceof Error ? `${label}: ${error.message}` : `${label}: falha desconhecida.`);
  }
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

export default function AgentWizardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { error: showError, success: showSuccess } = useToast();
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [configuration, setConfiguration] = useState<FranchiseAssistantConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIntentionWizard, setShowIntentionWizard] = useState(false);

  const [agentName, setAgentName] = useState("");
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [jobName, setJobName] = useState("");
  const [jobSite, setJobSite] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [behavior, setBehavior] = useState("");
  const [baseDescription, setBaseDescription] = useState("");
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [intentions, setIntentions] = useState<IntentionData[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>(defaultSettings({}));
  const [idleActions, setIdleActions] = useState<IdleActionDraft[]>([]);
  const [transferRules, setTransferRules] = useState<TransferRuleDraft[]>([]);
  const [webhooks, setWebhooks] = useState<Record<string, unknown>>({});
  const productNameLabel = jobName.trim() || "o produto";

  useEffect(() => {
    if (!params?.id) return;
    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseAssistantConfiguration(params.id)
    ])
      .then(([franchiseData, connectionData, configurationData]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setConfiguration(configurationData);

        const rolePayload = asObject(getBlock(configurationData, "ROLE")?.payload);
        const behaviorPayload = asObject(getBlock(configurationData, "BEHAVIOR")?.payload);
        const basePayload = asObject(getBlock(configurationData, "BASE_DESCRIPTION")?.payload);
        const trainingsPayload = asObject(getBlock(configurationData, "TRAININGS")?.payload);
        const intentionsPayload = asObject(getBlock(configurationData, "INTENTIONS")?.payload);
        const settingsPayload = asObject(getBlock(configurationData, "AGENT_SETTINGS")?.payload);
        const idleActionsPayload = asObject(getBlock(configurationData, "IDLE_ACTIONS")?.payload);
        const transferRulesPayload = asObject(getBlock(configurationData, "TRANSFER_RULES")?.payload);

        setAgentName(String(rolePayload.assistantName ?? connectionData.agentName ?? `Assistente Vavive - ${franchiseData.name}`));
        setCommunicationType(rolePayload.communicationType === "FORMAL" || rolePayload.communicationType === "RELAXED" ? rolePayload.communicationType : "NORMAL");
        setObjectiveType(rolePayload.type === "SUPPORT" || rolePayload.type === "PERSONAL" ? rolePayload.type : "SALE");
        setJobName(String(rolePayload.jobName ?? franchiseData.name ?? "Vavive"));
        setJobSite(String(rolePayload.jobSite ?? "https://vavive.com.br"));
        setJobDescription(String(rolePayload.description ?? ""));
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
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Erro ao carregar dados."))
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  useEffect(() => {
    if (error) showError(error);
  }, [error, showError]);

  const hasWorkspace = Boolean(connection?.workspaceId);
  const hasAgent = Boolean(connection?.agentId);

  const handleProvisionAgent = useCallback(async () => {
    if (!params?.id || !connection?.workspaceId) {
      setError("Vincule um workspace antes de criar o assistente.");
      return;
    }
    if (!agentName.trim()) {
      setError("Informe o nome do assistente.");
      return;
    }
    setIsSaving(true);
    setError(null);
    let provisioned = false;
    try {
      await provisionFranchiseGptMakerAgent(params.id, {
        workspaceId: connection.workspaceId,
        workspaceName: connection.workspaceName ?? undefined,
        agentName: agentName.trim(),
        communicationType,
        type: objectiveType,
        jobName: jobName.trim() || franchise?.name || "Vavive",
        jobSite: jobSite.trim() || "https://vavive.com.br",
        jobDescription: [jobDescription, baseDescription].filter(Boolean).join("\n\n"),
        behavior,
        confirmCriticalChange: hasAgent
      });
      provisioned = true;

      await waitForRemoteAgentReadiness(params.id);

      const syncFailures: string[] = [];
      await syncStep("Configuracoes do agente", () => updateAgentSettings(params.id, settings), syncFailures);
      await syncStep("Webhooks", () => updateAgentWebhooks(params.id, webhooks), syncFailures);

      for (const [index, training] of trainings.entries()) {
        await syncStep(`Treinamento ${index + 1}`, () => createGptMakerTraining(params.id, trainingPayload(training)), syncFailures);
      }
      for (const [index, intention] of intentions.entries()) {
        await syncStep(`Intencao ${index + 1}`, () => createGptMakerIntention(params.id, intentionPayload(intention, index)), syncFailures);
      }
      for (const [index, action] of idleActions.entries()) {
        const { id, ...payload } = action;
        await syncStep(`Acao de inatividade ${index + 1}`, () => createIdleAction(params.id, payload), syncFailures);
      }
      for (const [index, rule] of transferRules.entries()) {
        const { id, ...payload } = rule;
        await syncStep(`Regra de transferencia ${index + 1}`, () => createTransferRule(params.id, payload), syncFailures);
      }

      if (syncFailures.length > 0) {
        throw new Error(`O agente foi criado no GPTMaker, mas algumas configuracoes nao sincronizaram: ${syncFailures.join(" | ")}`);
      }

      showSuccess("Assistente criado com sucesso.");
      router.push(`/franquias/${params.id}/agente/configuracao`);
    } catch (requestError) {
      let message = requestError instanceof Error ? requestError.message : "Erro ao criar assistente.";

      if (provisioned) {
        try {
          await deleteGptMakerAgent(params.id);
          message = `${message} O provisionamento foi desfeito para evitar cadastro inconsistente.`;
        } catch (rollbackError) {
          const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : "Nao foi possivel desfazer automaticamente o agente criado.";
          message = `${message} Falha ao desfazer o provisionamento: ${rollbackMessage}`;
        }
      }

      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    agentName,
    baseDescription,
    behavior,
    communicationType,
    connection,
    franchise?.name,
    hasAgent,
    idleActions,
    intentions,
    jobDescription,
    jobName,
    jobSite,
    objectiveType,
    params?.id,
    router,
    settings,
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
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
            <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Preenchido com o pre-setup da matriz.</p>
            <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">Edite qualquer campo antes de criar se esta unidade precisar fugir do padrao.</p>
          </div>
          <Field label="Nome do assistente" value={agentName} onChange={setAgentName} required />
          <OptionCards
            label="Comunicacao"
            description="Como o assistente se comunica"
            value={communicationType}
            onChange={(value) => setCommunicationType(value as typeof communicationType)}
            options={communicationOptions}
          />
          <RichTextarea label="Comportamento" value={behavior} onChange={setBehavior} rows={6} />
        </div>
      )
    },
    {
      id: "work",
      label: "Trabalho",
      icon: <Briefcase size={16} />,
      content: (
        <div className="space-y-6">
          <OptionCards
            label="Finalidade"
            value={objectiveType}
            onChange={(value) => setObjectiveType(value as typeof objectiveType)}
            options={objectiveOptions}
          />
          <Field label="Vende o produto" value={jobName} onChange={setJobName} />
          <Field label="Site oficial (opcional)" value={jobSite} onChange={setJobSite} />
          <RichTextarea
            label={`Descreve um pouco sobre ${productNameLabel}`}
            value={jobDescription}
            onChange={setJobDescription}
            rows={5}
          />
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
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma intencao configurada.</p>
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
        <PageHeader eyebrow="Assistente" title="Criar Assistente" />
        <section className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando...</p>
        </section>
      </AppShell>
    );
  }

  if (!hasWorkspace) {
    return (
      <AppShell>
        <PageHeader eyebrow="Assistente" title="Criar Assistente" />
        <section className="card p-6">
          <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            Vincule um workspace na tela da franquia antes de criar o assistente.
          </p>
        </section>
      </AppShell>
    );
  }

  if (hasAgent) {
    return (
      <AppShell>
        <PageHeader eyebrow="Assistente" title="Criar Assistente" />
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 size={24} className="text-green-500" />
            <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>Assistente ja configurado: {connection?.agentName}</p>
          </div>
          <button type="button" onClick={() => router.push(`/franquias/${params?.id}/agente/configuracao`)} className="btn-primary">
            Ir para configuracao
          </button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Assistente"
        title={`Criar Assistente - ${franchise?.name ?? ""}`}
        description="Revise o pre-setup herdado da matriz, ajuste o que precisar e crie o agente."
      />

      {error ? (
        <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{error}</p>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <SummaryCard icon={<Bot size={18} />} label="Agente" value={agentName || "Sem nome"} />
        <SummaryCard icon={<Briefcase size={18} />} label="Objetivo" value={objectiveOptions.find((item) => item.value === objectiveType)?.label ?? objectiveType} />
        <SummaryCard icon={<BookOpen size={18} />} label="Treinamentos" value={String(trainings.length)} />
        <SummaryCard icon={<Target size={18} />} label="Intencoes" value={String(intentions.length)} />
      </div>

      <section className="card p-6">
        <TabConfig tabs={tabs} defaultTab="profile" />
      </section>

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={() => void handleProvisionAgent()} disabled={isSaving || !agentName.trim()} className="btn-primary">
          <CheckCircle2 size={16} />
          {isSaving ? "Criando..." : "Criar Assistente"}
        </button>
      </div>
    </AppShell>
  );
}
