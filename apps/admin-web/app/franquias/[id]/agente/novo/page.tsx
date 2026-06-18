"use client";

import { AppShell } from "@/components/AppShell";
import { AssistantAvatar, buildAssistantAvatarDataUri } from "@/components/AssistantAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormWizard, type WizardStep } from "@/components/FormWizard";
import { PageHeader } from "@/components/PageHeader";
import { ToggleField, OptionCards, RichTextarea } from "@/components/FriendlyForm";
import { Field } from "@/components/FormSection";
import { useToast } from "@/components/Toast";
import {
  getFranchiseById,
  getFranchiseGptMakerConnection,
  getFranchiseDefaultContext,
  getFranchiseAssistantConfiguration,
  getGptMakerWorkspaceAgents,
  provisionFranchiseGptMakerAgent,
  getGptMakerIntentions,
  getGptMakerTrainings,
  createGptMakerIntention,
  createAgentTraining,
  type FranchiseAssistantConfiguration,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerIntention
} from "@/lib/api";
import { Bot, Sparkles, Target, BookOpen, CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, type ReactNode } from "react";

const avatarOptions = [
  { value: buildAssistantAvatarDataUri("#EEF2FF", "#4F46E5", "AT"), label: "Atendimento", description: "Tom profissional" },
  { value: buildAssistantAvatarDataUri("#ECFDF5", "#047857", "CO"), label: "Comercial", description: "Tom energético" },
  { value: buildAssistantAvatarDataUri("#FFF7ED", "#C2410C", "SU"), label: "Suporte", description: "Tom acolhedor" },
  { value: "", label: "Sem avatar", description: "Usar ícone padrão" },
];

const toneOptions = [
  { value: "FORMAL", label: "Formal", description: "Linguagem profissional e respeitosa", icon: "👔" },
  { value: "NORMAL", label: "Normal", description: "Equilíbrio entre formal e casual", icon: "💬" },
  { value: "RELAXED", label: "Relaxado", description: "Linguagem casual e amigável", icon: "😊" },
];

const objectiveOptions = [
  { value: "SALE", label: "Vendas", description: "Foco em converter leads em clientes", icon: "🎯" },
  { value: "SUPPORT", label: "Suporte", description: "Foco em resolver problemas", icon: "🛠️" },
  { value: "PERSONAL", label: "Atendimento", description: "Atendimento geral", icon: "🤝" },
];

export default function AgentWizardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { error: showError, success: showSuccess } = useToast();
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [configuration, setConfiguration] = useState<FranchiseAssistantConfiguration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(false);

  // Step 1: Name + Avatar
  const [agentName, setAgentName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");

  // Step 2: Personality
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [useEmojis, setUseEmojis] = useState(true);
  const [signMessages, setSignMessages] = useState(true);
  const [limitSubjects, setLimitSubjects] = useState(false);
  const [isCustomPersonality, setIsCustomPersonality] = useState(false);

  // Step 3: Trainings
  const [trainings, setTrainings] = useState<{ title: string; content: string }[]>([]);
  const [newTrainingTitle, setNewTrainingTitle] = useState("");
  const [newTrainingContent, setNewTrainingContent] = useState("");

  // Step 4: Intentions
  const [intentions, setIntentions] = useState<{ name: string; description: string; instructions: string }[]>([]);
  const [newIntentionName, setNewIntentionName] = useState("");
  const [newIntentionDesc, setNewIntentionDesc] = useState("");
  const [newIntentionInstructions, setNewIntentionInstructions] = useState("");

  useEffect(() => {
    if (!params?.id) return;
    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseDefaultContext(params.id),
      getFranchiseAssistantConfiguration(params.id)
    ])
      .then(([franchiseData, connectionData, contextData, assistantConfiguration]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setConfiguration(assistantConfiguration);
        setAgentName(connectionData.agentName ?? `Assistente Vavive - ${franchiseData.name}`);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
      })
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const hasAgent = !!connection?.agentId;
  const hasWorkspace = !!connection?.workspaceId;

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
    try {
      const response = await provisionFranchiseGptMakerAgent(params.id, {
        workspaceId: connection.workspaceId,
        workspaceName: connection.workspaceName ?? undefined,
        agentName,
        avatar: selectedAvatar || undefined,
        communicationType,
        type: objectiveType,
        jobName: franchise?.name ?? "Vavive",
        jobSite: "https://vavive.com.br",
        jobDescription: "",
        confirmCriticalChange: hasAgent
      });
      setConnection(response);

      // Send trainings after provisioning
      if (trainings.length > 0 && params.id) {
        await Promise.allSettled(
          trainings.map((t) => createAgentTraining(params.id, { title: t.title, content: t.content }))
        );
      }

      // Send intentions after provisioning
      if (intentions.length > 0 && params.id) {
        await Promise.allSettled(
          intentions.map((i) => createGptMakerIntention(params.id, { name: i.name, description: i.description, instructions: i.instructions }))
        );
      }

      showSuccess("Assistente criado com sucesso.");
      router.push(`/franquias/${params.id}/agente`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar assistente.");
    } finally {
      setIsSaving(false);
    }
  }, [params?.id, connection, agentName, selectedAvatar, communicationType, objectiveType, franchise, hasAgent, router, trainings, intentions]);

  const addTraining = useCallback(() => {
    if (!newTrainingTitle.trim() || !newTrainingContent.trim()) return;
    setTrainings((prev) => [...prev, { title: newTrainingTitle, content: newTrainingContent }]);
    setNewTrainingTitle("");
    setNewTrainingContent("");
  }, [newTrainingTitle, newTrainingContent]);

  const removeTraining = useCallback((index: number) => {
    setTrainings((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addIntention = useCallback(() => {
    if (!newIntentionName.trim()) return;
    setIntentions((prev) => [...prev, { name: newIntentionName, description: newIntentionDesc, instructions: newIntentionInstructions }]);
    setNewIntentionName("");
    setNewIntentionDesc("");
    setNewIntentionInstructions("");
  }, [newIntentionName, newIntentionDesc, newIntentionInstructions]);

  const removeIntention = useCallback((index: number) => {
    setIntentions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Check if standard profile has personality defaults
  const standardBlock = configuration?.blocks.find((b) => b.blockType === "BEHAVIOR");
  const hasStandardPersonality = standardBlock?.mode === "STANDARD" && standardBlock?.payload;

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
          <p className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 p-4 text-sm text-amber-800 dark:text-amber-300">
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
            <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
              Assistente já configurado: {connection?.agentName}
            </p>
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Para reconfigurar, acesse a tela de configuração do agente.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/franquias/${params?.id}/agente`)}
            className="btn-primary"
          >
            Ir para configuração
          </button>
        </section>
      </AppShell>
    );
  }

  const steps: WizardStep[] = [
    {
      id: "name-avatar",
      title: "Nome & Avatar",
      description: "Identidade do assistente",
      isValid: agentName.trim().length > 0,
      content: (
        <div className="space-y-6">
          <Field
            label="Nome do assistente"
            placeholder="Ex: Assistente Vavive - Unidade Centro"
            value={agentName}
            onChange={setAgentName}
            required
            hint="Este nome será exibido para os clientes"
          />

          <OptionCards
            label="Avatar"
            description="Escolha um avatar para o assistente"
            value={selectedAvatar}
            onChange={setSelectedAvatar}
            options={avatarOptions}
          />

          {selectedAvatar && (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--color-bg-secondary)" }}>
              <AssistantAvatar src={selectedAvatar} alt="Preview" fallbackLabel={agentName} className="h-12 w-12" />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Preview</p>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{agentName}</p>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: "personality",
      title: "Personalidade",
      description: "Tom e comportamento",
      isValid: true,
      content: (
        <div className="space-y-6">
          {hasStandardPersonality && !isCustomPersonality && (
            <div className="rounded-xl bg-brand-50 border border-brand-100 dark:bg-brand-900/20 dark:border-brand-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                    Usando padrão da matriz
                  </p>
                  <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                    Personalidade configurada pelo SUPER_ADMIN
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomPersonality(true)}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Customizar
                </button>
              </div>
            </div>
          )}

          <OptionCards
            label="Tom de voz"
            description="Como o assistente se comunica"
            value={communicationType}
            onChange={(v) => setCommunicationType(v as typeof communicationType)}
            options={toneOptions}
            disabled={hasStandardPersonality && !isCustomPersonality}
          />

          <OptionCards
            label="Objetivo"
            description="Qual o foco principal do assistente"
            value={objectiveType}
            onChange={(v) => setObjectiveType(v as typeof objectiveType)}
            options={objectiveOptions}
            disabled={hasStandardPersonality && !isCustomPersonality}
          />

          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Comportamento
            </p>
            <ToggleField
              label="Usar emojis"
              description="Assistente pode usar emojis nas mensagens"
              checked={useEmojis}
              onChange={setUseEmojis}
              disabled={hasStandardPersonality && !isCustomPersonality}
            />
            <ToggleField
              label="Assinar mensagens"
              description="Adicionar nome do assistente no final"
              checked={signMessages}
              onChange={setSignMessages}
              disabled={hasStandardPersonality && !isCustomPersonality}
            />
            <ToggleField
              label="Limitar assuntos"
              description="Responder apenas sobre o escopo definido"
              checked={limitSubjects}
              onChange={setLimitSubjects}
              disabled={hasStandardPersonality && !isCustomPersonality}
            />
          </div>
        </div>
      )
    },
    {
      id: "trainings",
      title: "Treinamentos",
      description: "Conhecimento do assistente",
      isValid: true,
      content: (
        <div className="space-y-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Adicione treinamentos para dar conhecimento ao assistente sobre sua empresa. Você pode pular e adicionar depois.
          </p>

          {trainings.length > 0 && (
            <div className="space-y-3">
              {trainings.map((t, i) => (
                <div key={i} className="card p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{t.title}</p>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{t.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTraining(i)}
                    className="text-sm text-red-500 hover:text-red-700 shrink-0"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="card p-4 space-y-4">
            <Field
              label="Título do treinamento"
              placeholder="Ex: Sobre a empresa"
              value={newTrainingTitle}
              onChange={setNewTrainingTitle}
            />
            <RichTextarea
              label="Conteúdo"
              placeholder="Descreva o conhecimento que o assistente deve ter..."
              value={newTrainingContent}
              onChange={setNewTrainingContent}
              rows={4}
            />
            <button
              type="button"
              onClick={addTraining}
              disabled={!newTrainingTitle.trim() || !newTrainingContent.trim()}
              className="btn-secondary text-sm"
            >
              + Adicionar treinamento
            </button>
          </div>
        </div>
      )
    },
    {
      id: "intentions",
      title: "Intenções",
      description: "O que o assistente deve fazer",
      isValid: true,
      content: (
        <div className="space-y-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Defina as intenções do assistente — situações em que ele deve agir de forma específica. Você pode pular e adicionar depois.
          </p>

          {intentions.length > 0 && (
            <div className="space-y-3">
              {intentions.map((intent, i) => (
                <div key={i} className="card p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{intent.name}</p>
                    {intent.description && (
                      <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>{intent.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIntention(i)}
                    className="text-sm text-red-500 hover:text-red-700 shrink-0"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="card p-4 space-y-4">
            <Field
              label="Nome da intenção"
              placeholder="Ex: Agendar reunião"
              value={newIntentionName}
              onChange={setNewIntentionName}
            />
            <Field
              label="Descrição"
              placeholder="Quando esta intenção deve ser acionada"
              value={newIntentionDesc}
              onChange={setNewIntentionDesc}
            />
            <RichTextarea
              label="Instruções"
              placeholder="O que o assistente deve fazer quando esta intenção for detectada..."
              value={newIntentionInstructions}
              onChange={setNewIntentionInstructions}
              rows={3}
            />
            <button
              type="button"
              onClick={addIntention}
              disabled={!newIntentionName.trim()}
              className="btn-secondary text-sm"
            >
              + Adicionar intenção
            </button>
          </div>
        </div>
      )
    },
    {
      id: "review",
      title: "Revisar & Criar",
      description: "Confirme os dados",
      isValid: agentName.trim().length > 0,
      content: (
        <div className="space-y-6">
          {/* Name + Avatar */}
          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Bot size={18} className="text-brand-500" />
              <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Identidade</h3>
            </div>
            <div className="flex items-center gap-3">
              <AssistantAvatar src={selectedAvatar || undefined} alt={agentName} fallbackLabel={agentName} className="h-10 w-10" />
              <div>
                <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{agentName}</p>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  {avatarOptions.find((a) => a.value === selectedAvatar)?.label || "Sem avatar"}
                </p>
              </div>
            </div>
          </div>

          {/* Personality */}
          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles size={18} className="text-brand-500" />
              <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Personalidade</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p style={{ color: "var(--color-text-tertiary)" }}>Tom de voz</p>
                <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {toneOptions.find((t) => t.value === communicationType)?.label}
                </p>
              </div>
              <div>
                <p style={{ color: "var(--color-text-tertiary)" }}>Objetivo</p>
                <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {objectiveOptions.find((o) => o.value === objectiveType)?.label}
                </p>
              </div>
            </div>
          </div>

          {/* Trainings */}
          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen size={18} className="text-brand-500" />
              <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Treinamentos</h3>
            </div>
            {trainings.length > 0 ? (
              <ul className="space-y-2">
                {trainings.map((t, i) => (
                  <li key={i} className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    • {t.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhum treinamento adicionado</p>
            )}
          </div>

          {/* Intentions */}
          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Target size={18} className="text-brand-500" />
              <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Intenções</h3>
            </div>
            {intentions.length > 0 ? (
              <ul className="space-y-2">
                {intentions.map((intent, i) => (
                  <li key={i} className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    • {intent.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma intenção adicionada</p>
            )}
          </div>
        </div>
      )
    }
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Assistente"
        title={`Criar Assistente - ${franchise?.name ?? ""}`}
        description="Configure o assistente da franquia em 5 passos simples."
      />

      {error && (
        <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 mb-4">
          {error}
        </p>
      )}

      <FormWizard
        steps={steps}
        onComplete={() => {
          if (hasAgent) {
            setConfirmAction(true);
          } else {
            handleProvisionAgent();
          }
        }}
        submitLabel={hasAgent ? "Reconfigurar" : "Criar Assistente"}
        isSubmitting={isSaving}
      />

      <ConfirmDialog
        isOpen={confirmAction}
        title="Reconfigurar assistente"
        description="Esta ação substitui a configuração atual do assistente."
        confirmLabel="Reconfigurar"
        onCancel={() => setConfirmAction(false)}
        onConfirm={() => {
          setConfirmAction(false);
          handleProvisionAgent();
        }}
      />
    </AppShell>
  );
}
