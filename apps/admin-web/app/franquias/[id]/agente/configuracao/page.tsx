"use client";

import { AppShell } from "@/components/AppShell";
import { AssistantAvatar, buildAssistantAvatarDataUri } from "@/components/AssistantAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Field } from "@/components/FormSection";
import { OptionCards, RichTextarea, SelectField, ToggleField } from "@/components/FriendlyForm";
import { PageHeader } from "@/components/PageHeader";
import { TabConfig, type TabItem } from "@/components/TabConfig";
import { useToast } from "@/components/Toast";
import {
  clearFranchiseAgent,
  createGptMakerIntention,
  customizeFranchiseAssistantBlock,
  getAgentSettings,
  getFranchiseAssistantConfiguration,
  getFranchiseById,
  getFranchiseGptMakerConnection,
  getGptMakerIntentions,
  getGptMakerTrainings,
  provisionFranchiseGptMakerAgent,
  updateAgentSettings,
  updateFranchiseAssistantBlock,
  type FranchiseAssistantConfiguration,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerIntention
} from "@/lib/api";
import { BookOpen, Bot, Plus, Save, Settings, Sparkles, Target } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const avatarOptions = [
  { label: "Atendimento", value: buildAssistantAvatarDataUri("#EEF2FF", "#4F46E5", "AT"), description: "Visual neutro" },
  { label: "Comercial", value: buildAssistantAvatarDataUri("#ECFDF5", "#047857", "CO"), description: "Foco em vendas" },
  { label: "Suporte", value: buildAssistantAvatarDataUri("#FFF7ED", "#C2410C", "SU"), description: "Foco em apoio" },
  { label: "Sem avatar", value: "", description: "Usar fallback local" }
];

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const [agentName, setAgentName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [useEmojis, setUseEmojis] = useState(false);
  const [signMessages, setSignMessages] = useState(false);
  const [limitSubjects, setLimitSubjects] = useState(false);

  const [newTrainingTitle, setNewTrainingTitle] = useState("");
  const [newTrainingContent, setNewTrainingContent] = useState("");
  const [newIntentionName, setNewIntentionName] = useState("");
  const [newIntentionDescription, setNewIntentionDescription] = useState("");
  const [newIntentionInstructions, setNewIntentionInstructions] = useState("");

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
      getGptMakerTrainings(params.id).catch(() => [])
    ])
      .then(([franchiseData, connectionData, configurationData, settingsData, intentionsData, trainingsData]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setConfiguration(configurationData);
        setSettings(settingsData);
        setIntentions(intentionsData);
        setTrainings(trainingsData as Array<{ id?: string; title?: string; content?: string }>);
        setAgentName(connectionData.agentName ?? franchiseData.name);
        const settingsObject = settingsData as Record<string, unknown>;
        setSelectedAvatar(String(settingsObject.avatar ?? ""));
        setUseEmojis(Boolean(settingsObject.enabledEmoji ?? settingsObject.useEmojis));
        setSignMessages(Boolean(settingsObject.signMessages));
        setLimitSubjects(Boolean(settingsObject.limitSubjects));
      })
      .catch((requestError) => showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar configuracao do assistente."))
      .finally(() => setIsLoading(false));
  }, [params?.id, showError]);

  const hasAgent = Boolean(connection?.agentId);
  const behaviorBlock = useMemo(() => configuration?.blocks.find((block) => block.blockType === "BEHAVIOR"), [configuration]);
  const trainingsBlock = useMemo(() => configuration?.blocks.find((block) => block.blockType === "TRAININGS"), [configuration]);
  const intentionsBlock = useMemo(() => configuration?.blocks.find((block) => block.blockType === "INTENTIONS"), [configuration]);
  const useStandardPersonality = behaviorBlock?.mode === "STANDARD";
  const useStandardTrainings = trainingsBlock?.mode === "STANDARD";
  const useStandardIntentions = intentionsBlock?.mode === "STANDARD";

  const refreshBlockMode = useCallback(async (blockType: "TRAININGS" | "INTENTIONS", mode: "STANDARD" | "CUSTOM") => {
    if (!params?.id) {
      return;
    }
    const next = mode === "CUSTOM"
      ? await customizeFranchiseAssistantBlock(params.id, blockType)
      : await updateFranchiseAssistantBlock(params.id, blockType, "STANDARD");
    setConfiguration(next);
    showSuccess(mode === "CUSTOM" ? "Bloco customizado para a unidade." : "Bloco voltou para o padrao da matriz.");
  }, [params?.id, showSuccess]);

  const handleSaveProfile = useCallback(async () => {
    if (!params?.id || !connection?.workspaceId) {
      showError("Workspace nao vinculado. Vincule a unidade primeiro.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await provisionFranchiseGptMakerAgent(params.id, {
        workspaceId: connection.workspaceId,
        workspaceName: connection.workspaceName ?? undefined,
        agentName,
        avatar: selectedAvatar || undefined,
        communicationType,
        type: objectiveType,
        confirmCriticalChange: true,
        jobName: franchise?.name ?? "Assistente Vavive"
      });
      setConnection(updated);
      showSuccess("Perfil do assistente salvo com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar o perfil.");
    } finally {
      setIsSaving(false);
    }
  }, [agentName, communicationType, connection?.workspaceId, connection?.workspaceName, franchise?.name, objectiveType, params?.id, selectedAvatar, showError, showSuccess]);

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

  const handleAddTraining = useCallback(() => {
    if (!newTrainingTitle.trim() || !newTrainingContent.trim()) {
      return;
    }
    setTrainings((current) => [...current, { title: newTrainingTitle, content: newTrainingContent }]);
    setNewTrainingTitle("");
    setNewTrainingContent("");
    showSuccess("Treinamento adicionado na fila local.");
  }, [newTrainingContent, newTrainingTitle, showSuccess]);

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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {avatarOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setSelectedAvatar(option.value)}
                className={`rounded-2xl border p-3 text-left transition ${selectedAvatar === option.value ? "border-brand-500 bg-brand-50 ring-4 ring-brand-50" : "border-line bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"}`}
              >
                {option.value ? (
                  <AssistantAvatar src={option.value} alt={option.label} fallbackLabel={option.label} className="h-16 w-16 object-cover ring-1 ring-line" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold dark:bg-slate-800" style={{ color: "var(--color-text-secondary)" }}>
                    Sem foto
                  </div>
                )}
                <span className="mt-3 block text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{option.label}</span>
              </button>
            ))}
          </div>
          <OptionCards label="Objetivo" value={objectiveType} onChange={(value) => setObjectiveType(value as typeof objectiveType)} options={objectiveOptions} />
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
            onCustomize={() => showSuccess("A unidade ja pode editar personalidade nesta tela.")}
            onRestore={() => showSuccess("A unidade ja esta usando configuracao propria nesta tela.")}
          />
          <OptionCards label="Tom de voz" value={communicationType} onChange={(value) => setCommunicationType(value as typeof communicationType)} options={communicationOptions} />
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Comportamento</p>
            <ToggleField label="Usar emojis" checked={useEmojis} onChange={setUseEmojis} />
            <ToggleField label="Assinar mensagens" checked={signMessages} onChange={setSignMessages} />
            <ToggleField label="Limitar assuntos" checked={limitSubjects} onChange={setLimitSubjects} />
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
                <div key={training.id ?? index} className="card p-4">
                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{training.title || `Treinamento ${index + 1}`}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{training.content || ""}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhum treinamento cadastrado.</p>
          )}
          <div className="card p-4 space-y-4">
            <Field label="Titulo" value={newTrainingTitle} onChange={setNewTrainingTitle} placeholder="Ex: Servicos da unidade" disabled={Boolean(useStandardTrainings)} />
            <RichTextarea label="Conteudo" value={newTrainingContent} onChange={setNewTrainingContent} rows={4} placeholder="Conteudo do treinamento" disabled={Boolean(useStandardTrainings)} />
            <button type="button" onClick={handleAddTraining} disabled={Boolean(useStandardTrainings) || !newTrainingTitle.trim() || !newTrainingContent.trim()} className="btn-secondary text-sm">
              Adicionar treinamento
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
                <div key={intention.id} className="card p-4">
                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{intention.description}</p>
                  {intention.instructions ? <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{intention.instructions}</p> : null}
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
          <SelectField
            label="Modelo"
            value={String(settings.prefferModel ?? "GPT_4_O")}
            onChange={(value) => setSettings((current) => ({ ...current, prefferModel: value }))}
            options={[
              { value: "GPT_4_O", label: "GPT-4o" },
              { value: "GPT_4_O_MINI", label: "GPT-4o Mini" },
              { value: "GPT_5", label: "GPT-5" },
              { value: "CLAUDE_4_5_SONNET", label: "Claude 4.5 Sonnet" }
            ]}
          />
          <SelectField
            label="Fuso horario"
            value={String(settings.timezone ?? "America/Sao_Paulo")}
            onChange={(value) => setSettings((current) => ({ ...current, timezone: value }))}
            options={[
              { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
              { value: "America/Manaus", label: "America/Manaus" }
            ]}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <ToggleField label="Transferencia humana" checked={Boolean(settings.enabledHumanTransfer)} onChange={(value) => setSettings((current) => ({ ...current, enabledHumanTransfer: value }))} />
            <ToggleField label="Lembretes" checked={Boolean(settings.enabledReminder)} onChange={(value) => setSettings((current) => ({ ...current, enabledReminder: value }))} />
            <ToggleField label="Separar mensagens" checked={Boolean(settings.splitMessages)} onChange={(value) => setSettings((current) => ({ ...current, splitMessages: value }))} />
            <ToggleField label="Usar emojis" checked={Boolean(settings.enabledEmoji)} onChange={(value) => setSettings((current) => ({ ...current, enabledEmoji: value }))} />
            <ToggleField label="Limitar assuntos" checked={Boolean(settings.limitSubjects)} onChange={(value) => setSettings((current) => ({ ...current, limitSubjects: value }))} />
            <ToggleField label="Assinar mensagens" checked={Boolean(settings.signMessages)} onChange={(value) => setSettings((current) => ({ ...current, signMessages: value }))} />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={handleSaveSettings} disabled={isSaving} className="btn-primary">
              <Save size={16} />
              {isSaving ? "Salvando..." : "Salvar configuracoes"}
            </button>
          </div>
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
