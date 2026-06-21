"use client";

import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ConversationSettings } from "@/components/ConversationSettings";
import { Field } from "@/components/FormSection";
import { IdleActionsSettings } from "@/components/IdleActionsSettings";
import { OptionCards, RichTextarea, SelectField, ToggleField } from "@/components/FriendlyForm";
import { PageHeader } from "@/components/PageHeader";
import { StatusDropdown } from "@/components/StatusDropdown";
import { TabConfig, type TabItem } from "@/components/TabConfig";
import { useToast } from "@/components/Toast";
import { TransferRulesSettings } from "@/components/TransferRulesSettings";
import { WebhooksSettings } from "@/components/WebhooksSettings";
import {
  activateAgent,
  clearFranchiseAgent,
  createGptMakerIntention,
  createGptMakerTraining,
  createIdleAction,
  createTransferRule,
  customizeFranchiseAssistantBlock,
  deleteGptMakerIntention,
  deleteGptMakerTraining,
  deleteIdleAction,
  deleteTransferRule,
  getAgentSettings,
  getAgentWebhooks,
  getFranchiseAssistantConfiguration,
  getFranchiseById,
  getFranchiseGptMakerConnection,
  getGptMakerIntentions,
  getGptMakerTrainings,
  getIdleActions,
  getTransferRules,
  inactivateAgent,
  updateGptMakerAgent,
  updateAgentSettings,
  updateAgentWebhooks,
  updateFranchiseAssistantBlock,
  updateIdleAction,
  updateTransferRule,
  type FranchiseAssistantConfiguration,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerIntention,
  type AgentSyncStatus,
} from "@/lib/api";
import { BookOpen, Bot, Plus, Save, Settings, Sparkles, Target } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const objectiveOptions = [
  { value: "SALE", label: "Vendas", description: "Conduzir fechamento" },
  { value: "SUPPORT", label: "Suporte", description: "Resolver duvidas" },
  { value: "PERSONAL", label: "Atendimento geral", description: "Fluxo amplo da unidade" }
];

const communicationOptions = [
  { value: "FORMAL", label: "Formal", description: "Mais institucional" },
  { value: "NORMAL", label: "Normal", description: "Equilibrado" },
  { value: "RELAXED", label: "Relaxado", description: "Mais proximo e leve" }
];

const communicationTypeValues = new Set(["FORMAL", "NORMAL", "RELAXED"]);
const objectiveTypeValues = new Set(["SUPPORT", "SALE", "PERSONAL"]);

function resolveProfileDraft(
  configuration: FranchiseAssistantConfiguration | null,
  settings: Record<string, unknown>,
  connection: FranchiseGptMakerConnection | null,
  franchise: FranchiseSummary | null
) {
  const rolePayload = configuration?.blocks.find((block) => block.blockType === "ROLE")?.payload ?? {};
  const behaviorPayload = configuration?.blocks.find((block) => block.blockType === "BEHAVIOR")?.payload ?? {};
  const communicationType = typeof rolePayload.communicationType === "string" && communicationTypeValues.has(rolePayload.communicationType)
    ? rolePayload.communicationType as "FORMAL" | "NORMAL" | "RELAXED"
    : "NORMAL";
  const objectiveType = typeof rolePayload.type === "string" && objectiveTypeValues.has(rolePayload.type)
    ? rolePayload.type as "SUPPORT" | "SALE" | "PERSONAL"
    : "SALE";
  const behavior = typeof behaviorPayload.instruction === "string" ? behaviorPayload.instruction : "";

  return {
    agentName: connection?.agentName ?? franchise?.name ?? "",
    communicationType,
    objectiveType,
    behavior,
    useEmojis: Boolean(settings.enabledEmoji ?? settings.useEmojis),
    signMessages: Boolean(settings.signMessages),
    limitSubjects: Boolean(settings.limitSubjects)
  };
}

function BlockNotice({
  title,
  active,
  onCustomize,
  onRestore
}: {
  title: string;
  active: boolean;
  onCustomize: () => void;
  onRestore: () => void;
}) {
  return active ? (
    <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-700 dark:text-brand-300">{title} usando padrao da matriz</p>
          <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">Clique em customizar para assumir este bloco na unidade.</p>
        </div>
        <button type="button" onClick={onCustomize} className="text-sm font-medium text-brand-600 dark:text-brand-400">
          Customizar
        </button>
      </div>
    </div>
  ) : (
    <div className="flex justify-end">
      <button type="button" onClick={onRestore} className="btn-secondary text-sm">
        Voltar ao padrao
      </button>
    </div>
  );
}

export default function AgentConfigPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { error: showError, success: showSuccess } = useToast();
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [configuration, setConfiguration] = useState<FranchiseAssistantConfiguration | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [trainings, setTrainings] = useState<Array<{ id?: string; title?: string; content?: string }>>([]);
  const [intentions, setIntentions] = useState<GptMakerIntention[]>([]);
  const [idleActions, setIdleActions] = useState<Array<Record<string, unknown>>>([]);
  const [webhooks, setWebhooks] = useState<Record<string, unknown>>({});
  const [transferRules, setTransferRules] = useState<Array<Record<string, unknown>>>([]);
  const [syncStatus, setSyncStatus] = useState<AgentSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const [agentName, setAgentName] = useState("");
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [behavior, setBehavior] = useState("");
  const [useEmojis, setUseEmojis] = useState(false);
  const [signMessages, setSignMessages] = useState(false);
  const [limitSubjects, setLimitSubjects] = useState(false);

  const [newTrainingTitle, setNewTrainingTitle] = useState("");
  const [newTrainingContent, setNewTrainingContent] = useState("");
  const [newIntentionName, setNewIntentionName] = useState("");
  const [newIntentionDescription, setNewIntentionDescription] = useState("");
  const [newIntentionInstructions, setNewIntentionInstructions] = useState("");

  const applyProfileDraft = useCallback((
    nextConfiguration: FranchiseAssistantConfiguration | null,
    nextSettings: Record<string, unknown>,
    nextConnection: FranchiseGptMakerConnection | null,
    nextFranchise: FranchiseSummary | null
  ) => {
    const draft = resolveProfileDraft(nextConfiguration, nextSettings, nextConnection, nextFranchise);
    setAgentName(draft.agentName);
    setCommunicationType(draft.communicationType);
    setObjectiveType(draft.objectiveType);
    setBehavior(draft.behavior);
    setUseEmojis(draft.useEmojis);
    setSignMessages(draft.signMessages);
    setLimitSubjects(draft.limitSubjects);
  }, []);

  useEffect(() => {
    if (!params?.id) {
      return;
    }
    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseAssistantConfiguration(params.id),
      getAgentSettings(params.id).catch(() => ({})),
      getGptMakerIntentions(params.id).catch(() => []),
      getGptMakerTrainings(params.id).catch(() => []),
      getIdleActions(params.id).catch(() => ({ actions: [] })),
      getAgentWebhooks(params.id).catch(() => ({})),
      getTransferRules(params.id).catch(() => []),
    ])
      .then(([franchiseData, connectionData, configurationData, settingsData, intentionsData, trainingsData, idleActionsData, webhooksData, transferRulesData]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setConfiguration(configurationData);
        setSettings(settingsData);
        setIntentions(Array.isArray(intentionsData) ? intentionsData : []);
        // Map GPTMaker training format {id, type, text} to frontend format {id, title, content}
        const trainingsArray = Array.isArray(trainingsData) ? trainingsData as Array<Record<string, unknown>> : [];
        const mappedTrainings = trainingsArray.map((t) => ({
          id: t.id as string | undefined,
          title: (t.title as string) || (t.type as string) || "Treinamento",
          content: (t.content as string) || (t.text as string) || "",
        }));
        setTrainings(mappedTrainings);
        // Map idle actions
        const idleActionsObj = idleActionsData as Record<string, unknown>;
        setIdleActions(Array.isArray(idleActionsObj?.actions) ? idleActionsObj.actions as Array<Record<string, unknown>> : []);
        // Map webhooks
        setWebhooks(webhooksData as Record<string, unknown>);
        // Map transfer rules
        setTransferRules(Array.isArray(transferRulesData) ? transferRulesData as Array<Record<string, unknown>> : []);
        setSyncStatus({
          status: connectionData.status || franchiseData.status || "ATIVA",
          agentId: connectionData.agentId ?? null,
          agentName: connectionData.agentName ?? null,
          syncedAt: connectionData.lastSyncAt ?? undefined,
        });
        const settingsObject = settingsData as Record<string, unknown>;
        applyProfileDraft(configurationData, settingsObject, connectionData, franchiseData);
      })
      .catch((requestError) => showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar configuracao do assistente."))
      .finally(() => setIsLoading(false));
  }, [applyProfileDraft, params?.id, showError]);

  const hasAgent = Boolean(connection?.agentId);
  const agentStatus = syncStatus?.status || connection?.status || franchise?.status || "ATIVA";
  const behaviorBlock = useMemo(() => configuration?.blocks.find((block) => block.blockType === "BEHAVIOR"), [configuration]);
  const trainingsBlock = useMemo(() => configuration?.blocks.find((block) => block.blockType === "TRAININGS"), [configuration]);
  const intentionsBlock = useMemo(() => configuration?.blocks.find((block) => block.blockType === "INTENTIONS"), [configuration]);
  const useStandardPersonality = behaviorBlock?.mode === "STANDARD";
  const useStandardTrainings = trainingsBlock?.mode === "STANDARD";
  const useStandardIntentions = intentionsBlock?.mode === "STANDARD";

  const refreshBlockMode = useCallback(async (
    blockType: "BEHAVIOR" | "TRAININGS" | "INTENTIONS",
    mode: "STANDARD" | "CUSTOM"
  ) => {
    if (!params?.id) {
      return;
    }
    const next = mode === "CUSTOM"
      ? await customizeFranchiseAssistantBlock(params.id, blockType)
      : await updateFranchiseAssistantBlock(params.id, blockType, "STANDARD");
    setConfiguration(next);
    if (blockType === "BEHAVIOR") {
      applyProfileDraft(next, settings, connection, franchise);
    }
    showSuccess(mode === "CUSTOM" ? "Bloco customizado para a unidade." : "Bloco voltou para o padrao da matriz.");
  }, [applyProfileDraft, connection, franchise, params?.id, settings, showSuccess]);

  const handleSaveProfile = useCallback(async () => {
    if (!params?.id) {
      return;
    }
    setIsSaving(true);
    try {
      const profileDraft = useStandardPersonality
        ? resolveProfileDraft(configuration, settings, connection, franchise)
        : {
            agentName,
            communicationType,
            objectiveType,
            behavior
          };

      // Use updateAgent instead of provisionAgent to avoid creating a new agent
      await updateGptMakerAgent(params.id, {
        name: profileDraft.agentName,
        communicationType: profileDraft.communicationType,
        type: profileDraft.objectiveType,
        behavior: profileDraft.behavior,
        jobName: franchise?.name ?? "Assistente Vavive"
      });

      // Update local state
      setConnection((prev) => prev ? { ...prev, agentName: profileDraft.agentName } : null);
      if (useStandardPersonality) {
        applyProfileDraft(configuration, settings, connection, franchise);
      }
      showSuccess("Perfil do assistente salvo com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar o perfil.");
    } finally {
      setIsSaving(false);
    }
  }, [
    agentName,
    applyProfileDraft,
    behavior,
    communicationType,
    configuration,
    connection,
    franchise,
    objectiveType,
    params?.id,
    settings,
    showError,
    showSuccess,
    useStandardPersonality
  ]);

  const handleSaveSettings = useCallback(async () => {
    if (!params?.id) {
      return;
    }
    setIsSaving(true);
    try {
      await updateAgentSettings(params.id, settings);
      showSuccess("Configuracoes tecnicas salvas.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar configuracoes.");
    } finally {
      setIsSaving(false);
    }
  }, [params?.id, settings, showError, showSuccess]);

  const handleAddTraining = useCallback(async () => {
    if (!params?.id || !newTrainingContent.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      const created = await createGptMakerTraining(params.id, {
        type: "TEXT",
        text: newTrainingContent
      });
      const createdRecord = created as Record<string, unknown>;
      setTrainings((current) => [...current, {
        id: createdRecord.id as string | undefined,
        title: newTrainingTitle || (createdRecord.type as string) || "Treinamento",
        content: newTrainingContent
      }]);
      setNewTrainingTitle("");
      setNewTrainingContent("");
      showSuccess("Treinamento criado com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar treinamento.");
    } finally {
      setIsSaving(false);
    }
  }, [newTrainingContent, newTrainingTitle, params?.id, showError, showSuccess]);

  const handleAddIntention = useCallback(async () => {
    if (!params?.id || !newIntentionName.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      const created = await createGptMakerIntention(params.id, {
        name: newIntentionName,
        description: newIntentionDescription,
        instructions: newIntentionInstructions
      });
      setIntentions((current) => [...current, created]);
      setNewIntentionName("");
      setNewIntentionDescription("");
      setNewIntentionInstructions("");
      showSuccess("Intencao criada com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar intencao.");
    } finally {
      setIsSaving(false);
    }
  }, [newIntentionDescription, newIntentionInstructions, newIntentionName, params?.id, showError, showSuccess]);

  const tabs: TabItem[] = [
    {
      id: "profile",
      label: "Perfil",
      icon: <Bot size={16} />,
      content: (
        <div className="space-y-6">
          <Field label="Nome do assistente" value={agentName} onChange={setAgentName} required />
          <OptionCards
            label="Comunicacao"
            description="Como o assistente se comunica"
            value={communicationType}
            onChange={(value) => setCommunicationType(value as typeof communicationType)}
            options={communicationOptions}
          />
          <OptionCards label="Objetivo" value={objectiveType} onChange={(value) => setObjectiveType(value as typeof objectiveType)} options={objectiveOptions} />
          <RichTextarea
            label="Comportamento"
            placeholder="Descreva como o agente deve se comportar durante a conversa..."
            value={behavior}
            onChange={setBehavior}
            rows={5}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Status do agente</p>
            <StatusDropdown
              currentStatus={agentStatus}
              onChange={async (newStatus) => {
                if (!params?.id) return;
                setIsSaving(true);
                            try {
                              let nextStatus = newStatus;
                              if (newStatus === "ATIVA") {
                                await activateAgent(params.id);
                              } else if (newStatus === "INATIVA") {
                                await inactivateAgent(params.id);
                              }
                              // TRAINING is intentionally disabled for now. GPTMaker rejects this update with the current token/API contract.
                              setSyncStatus((prev) => ({
                                status: nextStatus,
                                agentId: prev?.agentId ?? connection?.agentId ?? null,
                                agentName: prev?.agentName ?? connection?.agentName ?? null,
                                syncedAt: new Date().toISOString(),
                              }));
                              showSuccess(`Status alterado para ${newStatus === "ATIVA" ? "Ativo" : newStatus === "TRAINING" ? "Treinamento" : "Desativado"}.`);
                            } catch (e) {
                              showError(e instanceof Error ? e.message : "Nao foi possivel alterar o status do agente.");
                            } finally {
                              setIsSaving(false);
                            }
                          }}
              disabled={isSaving}
            />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={handleSaveProfile} disabled={isSaving} className="btn-primary">
              <Save size={16} />
              {isSaving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </div>
      )
    },
    {
      id: "personality",
      label: "Personalidade",
      icon: <Sparkles size={16} />,
      content: (
        <div className="space-y-6">
          <BlockNotice
            title="Personalidade"
            active={Boolean(useStandardPersonality)}
            onCustomize={() => void refreshBlockMode("BEHAVIOR", "CUSTOM")}
            onRestore={() => void refreshBlockMode("BEHAVIOR", "STANDARD")}
          />
          <OptionCards
            label="Tom de voz"
            value={communicationType}
            onChange={(value) => setCommunicationType(value as typeof communicationType)}
            options={communicationOptions}
            disabled={Boolean(useStandardPersonality)}
          />
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Comportamento</p>
            <ToggleField label="Usar emojis" checked={useEmojis} onChange={setUseEmojis} disabled={Boolean(useStandardPersonality)} />
            <ToggleField label="Assinar mensagens" checked={signMessages} onChange={setSignMessages} disabled={Boolean(useStandardPersonality)} />
            <ToggleField label="Limitar assuntos" checked={limitSubjects} onChange={setLimitSubjects} disabled={Boolean(useStandardPersonality)} />
          </div>
        </div>
      )
    },
    {
      id: "trainings",
      label: "Treinamentos",
      icon: <BookOpen size={16} />,
      badge: String(trainings.length),
      content: (
        <div className="space-y-6">
          <BlockNotice
            title="Treinamentos"
            active={Boolean(useStandardTrainings)}
            onCustomize={() => void refreshBlockMode("TRAININGS", "CUSTOM")}
            onRestore={() => void refreshBlockMode("TRAININGS", "STANDARD")}
          />
          {trainings.length ? (
            <div className="space-y-3">
              {trainings.map((training, index) => (
                <div key={training.id ?? index} className="card p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{training.title || `Treinamento ${index + 1}`}</p>
                    <p className="mt-1 text-sm line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{training.content || ""}</p>
                  </div>
                  {training.id && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!params?.id) return;
                        try {
                          await deleteGptMakerTraining(params.id, training.id!);
                          setTrainings((current) => current.filter((t) => t.id !== training.id));
                          showSuccess("Treinamento removido.");
                        } catch (err) {
                          showError(err instanceof Error ? err.message : "Erro ao remover treinamento.");
                        }
                      }}
                      className="text-sm text-red-500 hover:text-red-700 shrink-0"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhum treinamento cadastrado.</p>
          )}
          <div className="card p-4 space-y-4">
            <Field label="Titulo (opcional)" value={newTrainingTitle} onChange={setNewTrainingTitle} placeholder="Ex: Servicos da unidade" disabled={Boolean(useStandardTrainings)} />
            <RichTextarea label="Conteudo" value={newTrainingContent} onChange={setNewTrainingContent} rows={4} placeholder="Conteudo do treinamento" disabled={Boolean(useStandardTrainings)} />
            <button type="button" onClick={handleAddTraining} disabled={Boolean(useStandardTrainings) || !newTrainingContent.trim() || isSaving} className="btn-secondary text-sm">
              {isSaving ? "Salvando..." : "Adicionar treinamento"}
            </button>
          </div>
        </div>
      )
    },
    {
      id: "intentions",
      label: "Intencoes",
      icon: <Target size={16} />,
      badge: String(intentions.length),
      content: (
        <div className="space-y-6">
          <BlockNotice
            title="Intencoes"
            active={Boolean(useStandardIntentions)}
            onCustomize={() => void refreshBlockMode("INTENTIONS", "CUSTOM")}
            onRestore={() => void refreshBlockMode("INTENTIONS", "STANDARD")}
          />
          {intentions.length ? (
            <div className="space-y-3">
              {intentions.map((intention) => (
                <div key={intention.id} className="card p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{intention.description}</p>
                    {intention.instructions ? <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{intention.instructions}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!params?.id) return;
                      try {
                        await deleteGptMakerIntention(params.id, intention.id);
                        setIntentions((current) => current.filter((i) => i.id !== intention.id));
                        showSuccess("Intencao removida.");
                      } catch (err) {
                        showError(err instanceof Error ? err.message : "Erro ao remover intencao.");
                      }
                    }}
                    className="text-sm text-red-500 hover:text-red-700 shrink-0"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma intencao cadastrada.</p>
          )}
          <div className="card p-4 space-y-4">
            <Field label="Nome" value={newIntentionName} onChange={setNewIntentionName} disabled={Boolean(useStandardIntentions)} />
            <Field label="Descricao" value={newIntentionDescription} onChange={setNewIntentionDescription} disabled={Boolean(useStandardIntentions)} />
            <RichTextarea label="Instrucoes" value={newIntentionInstructions} onChange={setNewIntentionInstructions} rows={3} disabled={Boolean(useStandardIntentions)} />
            <button type="button" onClick={handleAddIntention} disabled={Boolean(useStandardIntentions) || !newIntentionName.trim() || isSaving} className="btn-primary text-sm">
              <Plus size={14} />
              Adicionar intencao
            </button>
          </div>
        </div>
      )
    },
    {
      id: "settings",
      label: "Configuracoes",
      icon: <Settings size={16} />,
      content: (
        <div className="space-y-6">
          <TabConfig
            tabs={[
              {
                id: "conversation",
                label: "Conversa",
                content: (
                  <ConversationSettings
                    settings={settings}
                    onSave={async (newSettings) => {
                      if (!params?.id) return;
                      setIsSaving(true);
                      try {
                        await updateAgentSettings(params.id, newSettings);
                        setSettings(newSettings);
                        showSuccess("Configuracoes salvas.");
                      } catch (err) {
                        showError(err instanceof Error ? err.message : "Erro ao salvar configuracoes.");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    isSaving={isSaving}
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
                    onCreate={async (payload) => {
                      if (!params?.id) return;
                      const result = await createIdleAction(params.id, payload);
                      setIdleActions((prev) => [...prev, result as Record<string, unknown>]);
                      showSuccess("Acao criada.");
                    }}
                    onUpdate={async (actionId, payload) => {
                      if (!params?.id) return;
                      await updateIdleAction(params.id, actionId, payload);
                      setIdleActions((prev) => prev.map((a) => a.id === actionId ? { ...a, ...payload } : a));
                      showSuccess("Acao atualizada.");
                    }}
                    onDelete={async (actionId) => {
                      if (!params?.id) return;
                      await deleteIdleAction(params.id, actionId);
                      setIdleActions((prev) => prev.filter((a) => a.id !== actionId));
                      showSuccess("Acao removida.");
                    }}
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
                    onSave={async (newWebhooks) => {
                      if (!params?.id) return;
                      setIsSaving(true);
                      try {
                        await updateAgentWebhooks(params.id, newWebhooks);
                        setWebhooks(newWebhooks);
                        showSuccess("Webhooks salvos.");
                      } catch (err) {
                        showError(err instanceof Error ? err.message : "Erro ao salvar webhooks.");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    isSaving={isSaving}
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
                    onCreate={async (payload) => {
                      if (!params?.id) return;
                      const result = await createTransferRule(params.id, payload);
                      setTransferRules((prev) => [...prev, result as Record<string, unknown>]);
                      showSuccess("Regra criada.");
                    }}
                    onUpdate={async (ruleId, payload) => {
                      if (!params?.id) return;
                      await updateTransferRule(params.id, ruleId, payload);
                      setTransferRules((prev) => prev.map((r) => r.id === ruleId ? { ...r, ...payload } : r));
                      showSuccess("Regra atualizada.");
                    }}
                    onDelete={async (ruleId) => {
                      if (!params?.id) return;
                      await deleteTransferRule(params.id, ruleId);
                      setTransferRules((prev) => prev.filter((r) => r.id !== ruleId));
                      showSuccess("Regra removida.");
                    }}
                    isSaving={isSaving}
                  />
                )
              }
            ]}
            defaultTab="conversation"
          />
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader eyebrow="Assistente" title="Configuracao do Assistente" />
        <section className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando...</p>
        </section>
      </AppShell>
    );
  }

  if (!hasAgent) {
    return (
      <AppShell>
        <PageHeader eyebrow="Assistente" title="Configuracao do Assistente" />
        <section className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Nenhum assistente configurado. Crie um assistente primeiro.</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Assistente"
        title={franchise ? connection?.agentName ?? franchise.name : "Configuracao do Assistente"}
        description="Gerencie perfil, personalidade, treinamentos, intencoes e configuracoes tecnicas."
      />

      <TabConfig tabs={tabs} defaultTab="profile" />

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={() => setConfirmClear(true)} className="btn-secondary">
          Limpar assistente
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmClear}
        title="Limpar assistente"
        description="Esta acao remove o assistente atual da unidade."
        confirmLabel="Remover"
        onCancel={() => setConfirmClear(false)}
        onConfirm={async () => {
          if (!params?.id) {
            return;
          }
          setIsSaving(true);
          try {
            await clearFranchiseAgent(params.id, { confirmCriticalChange: true });
            showSuccess("Assistente removido.");
            router.push(`/franquias/${params.id}`);
          } catch (requestError) {
            showError(requestError instanceof Error ? requestError.message : "Nao foi possivel remover o assistente.");
          } finally {
            setIsSaving(false);
            setConfirmClear(false);
          }
        }}
      />
    </AppShell>
  );
}
