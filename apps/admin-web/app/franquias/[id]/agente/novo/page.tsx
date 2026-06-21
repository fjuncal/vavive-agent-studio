"use client";

import { AppShell } from "@/components/AppShell";
import { AssistantAvatar, buildAssistantAvatarDataUri, buildGamifiedAvatarDataUri } from "@/components/AssistantAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormWizard, type WizardStep } from "@/components/FormWizard";
import { PageHeader } from "@/components/PageHeader";
import { ToggleField, OptionCards, RichTextarea } from "@/components/FriendlyForm";
import { Field } from "@/components/FormSection";
import { TrainingEditor, type TrainingItem } from "@/components/TrainingEditor";
import { IntentionWizard, type IntentionData } from "@/components/IntentionWizard";
import { useToast } from "@/components/Toast";
import {
  getFranchiseById,
  getFranchiseGptMakerConnection,
  getFranchiseDefaultContext,
  getFranchiseAssistantConfiguration,
  provisionFranchiseGptMakerAgent,
  createGptMakerTraining,
  createGptMakerIntention,
  type FranchiseAssistantConfiguration,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
} from "@/lib/api";
import { Bot, User, Briefcase, BookOpen, Target, Settings, CheckCircle2, Plus, X, Sparkles } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";

const avatarOptions = [
  { value: "random-gamified", label: "Aleatorio", description: "Avatar gamificado aleatorio" },
  { value: buildAssistantAvatarDataUri("#EEF2FF", "#4F46E5", "AT"), label: "Atendimento", description: "Tom profissional" },
  { value: buildAssistantAvatarDataUri("#ECFDF5", "#047857", "CO"), label: "Comercial", description: "Tom energetico" },
  { value: buildAssistantAvatarDataUri("#FFF7ED", "#C2410C", "SU"), label: "Suporte", description: "Tom acolhedor" },
  { value: "", label: "Sem avatar", description: "Usar icone padrao" },
];

const communicationOptions = [
  { value: "FORMAL", label: "Formal", description: "Linguagem profissional e respeitosa", icon: "👔" },
  { value: "NORMAL", label: "Normal", description: "Equilibrio entre formal e casual", icon: "💬" },
  { value: "RELAXED", label: "Descontraida", description: "Linguagem casual e amigavel", icon: "😊" },
];

const objectiveOptions = [
  { value: "SUPPORT", label: "Suporte", description: "Use essa opcao sempre que o objetivo do seu agente for prestar suporte.", icon: "🛠️" },
  { value: "SALE", label: "Vendas", description: "Use sempre que quiser criar um agente no setor de vendas.", icon: "🎯" },
  { value: "PERSONAL", label: "Uso pessoal", description: "Escolha esta opcao caso seja um agente para uso pessoal.", icon: "🤝" },
];

type Mode = "default" | "edit" | "skip";

function StandardBanner({
  label,
  summary,
  preview,
  mode,
  onModeChange,
}: {
  label: string;
  summary: string;
  preview?: React.ReactNode;
  mode: Mode;
  onModeChange: (m: Mode) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: mode === "default" ? "var(--color-brand-500)" : mode === "skip" ? "var(--color-border)" : "var(--color-brand-200)",
        background: mode === "default" ? "var(--color-brand-50)" : "var(--color-bg-primary)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand-500 shrink-0" />
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{label}</p>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{summary}</p>
        </div>
        {preview && mode === "default" && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-brand-600 hover:text-brand-700 shrink-0 ml-2"
          >
            {expanded ? "Ocultar" : "Ver conteudo"}
          </button>
        )}
      </div>

      {preview && mode === "default" && expanded && (
        <div className="mb-3 rounded-lg p-3 text-sm" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
          {preview}
        </div>
      )}

      <div className="flex gap-2">
        {(["default", "edit", "skip"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition",
              mode === m
                ? m === "skip"
                  ? "bg-gray-600 text-white"
                  : "bg-brand-600 text-white"
                : m === "skip"
                  ? "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  : "bg-white text-brand-600 border border-brand-200 hover:bg-brand-50"
            )}
          >
            {m === "default" ? "Usar padrao" : m === "edit" ? "Editar" : "Nao usar"}
          </button>
        ))}
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(false);

  // Passo 1: Perfil
  const [agentName, setAgentName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [behavior, setBehavior] = useState("");
  const [profileMode, setProfileMode] = useState<Mode>("default");

  // Passo 2: Trabalho
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [productName, setProductName] = useState("");
  const [jobSite, setJobSite] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [workMode, setWorkMode] = useState<Mode>("default");

  // Passo 3: Treinamentos
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [trainingsMode, setTrainingsMode] = useState<Mode>("default");

  // Passo 4: Intencoes
  const [intentions, setIntentions] = useState<IntentionData[]>([]);
  const [showIntentionWizard, setShowIntentionWizard] = useState(false);
  const [intentionsMode, setIntentionsMode] = useState<Mode>("default");

  // Passo 5: Configuracoes
  const [useEmojis, setUseEmojis] = useState(true);
  const [signMessages, setSignMessages] = useState(true);
  const [limitSubjects, setLimitSubjects] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseDefaultContext(params.id),
      getFranchiseAssistantConfiguration(params.id),
    ])
      .then(([franchiseData, connectionData, contextData, assistantConfiguration]) => {
        setFranchise(franchiseData);
        setConnection(connectionData);
        setConfiguration(assistantConfiguration);
        setAgentName(connectionData.agentName ?? `Assistente Vavive - ${franchiseData.name}`);

        if (assistantConfiguration?.blocks) {
          const roleBlock = assistantConfiguration.blocks.find((b) => b.blockType === "ROLE");
          const behaviorBlock = assistantConfiguration.blocks.find((b) => b.blockType === "BEHAVIOR");
          const trainingsBlock = assistantConfiguration.blocks.find((b) => b.blockType === "TRAININGS");
          const intentionsBlock = assistantConfiguration.blocks.find((b) => b.blockType === "INTENTIONS");

          // Pre-fill profile from ROLE + BEHAVIOR
          if (roleBlock?.payload) {
            const p = roleBlock.payload as Record<string, unknown>;
            if (p.communicationType && ["FORMAL", "NORMAL", "RELAXED"].includes(p.communicationType as string)) {
              setCommunicationType(p.communicationType as "FORMAL" | "NORMAL" | "RELAXED");
            }
          }
          if (behaviorBlock?.payload) {
            const p = behaviorBlock.payload as Record<string, unknown>;
            if (typeof p.instruction === "string" && p.instruction.trim()) {
              setBehavior(p.instruction);
            }
          }

          // Pre-fill work from ROLE
          if (roleBlock?.payload) {
            const p = roleBlock.payload as Record<string, unknown>;
            if (p.type && ["SALE", "SUPPORT", "PERSONAL"].includes(p.type as string)) {
              setObjectiveType(p.type as "SUPPORT" | "SALE" | "PERSONAL");
            }
            if (typeof p.jobName === "string" && p.jobName.trim()) setProductName(p.jobName);
            if (typeof p.jobSite === "string") setJobSite(p.jobSite);
            if (typeof p.description === "string") setJobDescription(p.description);
          }

          // Pre-fill trainings
          if (trainingsBlock?.payload) {
            const p = trainingsBlock.payload as Record<string, unknown>;
            if (Array.isArray(p.items) && p.items.length > 0) {
              setTrainings(p.items.map((item: Record<string, unknown>) => ({
                type: "TEXT" as const,
                text: (item.content as string) || (item.text as string) || "",
              })));
              setTrainingsMode("default");
            } else {
              setTrainingsMode("edit");
            }
          } else {
            setTrainingsMode("edit");
          }

          // Pre-fill intentions
          if (intentionsBlock?.payload) {
            const p = intentionsBlock.payload as Record<string, unknown>;
            if (Array.isArray(p.items) && p.items.length > 0) {
              setIntentions(p.items.map((item: Record<string, unknown>) => ({
                description: (item.name as string) || (item.description as string) || "",
                instructions: (item.instructions as string) || "",
                details: (item.details as string) || "",
                type: (item.type as IntentionData["type"]) || "WEBHOOK",
                httpMethod: (item.httpMethod as IntentionData["httpMethod"]) || "POST",
                url: (item.url as string) || "",
                headers: (item.headers as IntentionData["headers"]) || [],
                params: (item.params as IntentionData["params"]) || [],
                requestBody: (item.requestBody as string) || "",
                fields: (item.fields as IntentionData["fields"]) || [],
                variables: (item.variables as IntentionData["variables"]) || [],
                autoGenerateParams: (item.autoGenerateParams as boolean) ?? false,
                autoGenerateBody: (item.autoGenerateBody as boolean) ?? false,
              })));
              setIntentionsMode("default");
            } else {
              setIntentionsMode("edit");
            }
          } else {
            setIntentionsMode("edit");
          }
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar dados."))
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  useEffect(() => {
    if (error) showError(error);
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
      const resolvedCommunication = profileMode !== "skip" ? communicationType : "NORMAL";
      const resolvedObjective = workMode !== "skip" ? objectiveType : "SALE";
      const resolvedBehavior = profileMode !== "skip" ? behavior : "";
      const resolvedDescription = workMode !== "skip" ? jobDescription : "";

      const response = await provisionFranchiseGptMakerAgent(params.id, {
        workspaceId: connection.workspaceId,
        workspaceName: connection.workspaceName ?? undefined,
        agentName,
        communicationType: resolvedCommunication,
        type: resolvedObjective,
        jobName: productName || franchise?.name || "Vavive",
        jobSite: jobSite || "https://vavive.com.br",
        jobDescription: resolvedDescription,
        behavior: resolvedBehavior,
        confirmCriticalChange: hasAgent,
      });
      setConnection(response);

      // Send trainings
      if (trainingsMode !== "skip" && trainings.length > 0 && params.id) {
        await Promise.allSettled(
          trainings.map((t) => createGptMakerTraining(params.id, t as unknown as Record<string, unknown>))
        );
      }

      // Send intentions
      if (intentionsMode !== "skip" && intentions.length > 0 && params.id) {
        await Promise.allSettled(
          intentions.map((i) => createGptMakerIntention(params.id, i as unknown as Record<string, unknown>))
        );
      }

      showSuccess("Assistente criado com sucesso.");
      router.push(`/franquias/${params.id}/agente/configuracao`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar assistente.");
    } finally {
      setIsSaving(false);
    }
  }, [params?.id, connection, agentName, selectedAvatar, communicationType, objectiveType, behavior, productName, jobSite, jobDescription, franchise, hasAgent, router, trainings, intentions, profileMode, workMode, trainingsMode, intentionsMode, showSuccess, showError]);

  const hasStandardProfile = configuration?.blocks.some((b) => b.mode === "STANDARD" && b.payload) ?? false;
  const standardRoleBlock = configuration?.blocks.find((b) => b.blockType === "ROLE");
  const standardBehaviorBlock = configuration?.blocks.find((b) => b.blockType === "BEHAVIOR");
  const standardTrainingsBlock = configuration?.blocks.find((b) => b.blockType === "TRAININGS");
  const standardIntentionsBlock = configuration?.blocks.find((b) => b.blockType === "INTENTIONS");

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader eyebrow="Assistente" title="Criar Assistente" />
        <section className="card p-6"><p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando...</p></section>
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
            <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>Assistente ja configurado: {connection?.agentName}</p>
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>Para reconfigurar, acesse a tela de configuracao do agente.</p>
          <button type="button" onClick={() => router.push(`/franquias/${params?.id}/agente/configuracao`)} className="btn-primary">Ir para configuracao</button>
        </section>
      </AppShell>
    );
  }

  const profileSummary = standardRoleBlock?.payload
    ? `Comunicacao: ${(standardRoleBlock.payload as Record<string, unknown>).communicationType ?? "NORMAL"} | Comportamento pre-definido`
    : "Nenhum padrao definido";

  const workSummary = standardRoleBlock?.payload
    ? `Objetivo: ${(standardRoleBlock.payload as Record<string, unknown>).type ?? "SALE"} | ${(standardRoleBlock.payload as Record<string, unknown>).jobSite ?? "Sem site"}`
    : "Nenhum padrao definido";

  const trainingsCount = trainings.length;
  const trainingsSummary = trainingsCount > 0
    ? `${trainingsCount} treinamento(s): ${trainings.slice(0, 3).map(t => t.type === "TEXT" ? t.text.slice(0, 30) : t.type).join(", ")}${trainingsCount > 3 ? "..." : ""}`
    : "Nenhum treinamento padrao";

  const intentionsCount = intentions.length;
  const intentionsSummary = intentionsCount > 0
    ? `${intentionsCount} intencao(oes): ${intentions.slice(0, 3).map(i => i.description).join(", ")}${intentionsCount > 3 ? "..." : ""}`
    : "Nenhuma intencao padrao";

  const steps: WizardStep[] = [
    // Passo 1: Perfil
    {
      id: "profile",
      title: "Perfil do Agente",
      description: "Nome, comunicacao e comportamento",
      isValid: agentName.trim().length > 0,
      content: (
        <div className="space-y-6">
          <Field label="Nome do assistente" placeholder="Ex: Assistente Vavive - Unidade Centro" value={agentName} onChange={setAgentName} required hint="Este nome sera exibido para os clientes" />

          {hasStandardProfile && (
            <StandardBanner
              label="Configuracao de perfil definida pelo SUPER_ADMIN"
              summary={profileSummary}
              preview={
                <div className="space-y-2">
                  <p><span className="font-medium">Comunicacao:</span> {communicationOptions.find(c => c.value === communicationType)?.label ?? communicationType}</p>
                  {behavior && <p><span className="font-medium">Comportamento:</span> {behavior.slice(0, 200)}{behavior.length > 200 ? "..." : ""}</p>}
                </div>
              }
              mode={profileMode}
              onModeChange={setProfileMode}
            />
          )}

          {profileMode !== "skip" && (
            <>
              <OptionCards label="Comunicacao" description="Como o assistente se comunica" value={communicationType}
                onChange={(v) => setCommunicationType(v as typeof communicationType)} options={communicationOptions}
                disabled={profileMode === "default"}
              />
              <div className="relative">
                <RichTextarea label="Comportamento" placeholder="Descreva como o agente deve se comportar durante a conversa..." value={behavior} onChange={setBehavior} rows={5} disabled={profileMode === "default"} />
                {profileMode === "default" && behavior && (
                  <div className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                    Texto definido pelo SUPER_ADMIN. Clique em "Editar" para personalizar.
                  </div>
                )}
              </div>
            </>
          )}

          {profileMode === "skip" && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Perfil nao sera configurado. Voce pode configurar depois.</p>
            </div>
          )}
        </div>
      ),
    },
    // Passo 2: Trabalho
    {
      id: "work",
      title: "Trabalho",
      description: "Finalidade, produto e descricao",
      isValid: true,
      content: (
        <div className="space-y-6">
          {hasStandardProfile && (
            <StandardBanner
              label="Configuracao de trabalho definida pelo SUPER_ADMIN"
              summary={workSummary}
              preview={
                <div className="space-y-2">
                  <p><span className="font-medium">Finalidade:</span> {objectiveOptions.find(o => o.value === objectiveType)?.label ?? objectiveType}</p>
                  {productName && <p><span className="font-medium">Produto:</span> {productName}</p>}
                  {jobSite && <p><span className="font-medium">Site:</span> {jobSite}</p>}
                  {jobDescription && <p><span className="font-medium">Descricao:</span> {jobDescription.slice(0, 200)}{jobDescription.length > 200 ? "..." : ""}</p>}
                </div>
              }
              mode={workMode}
              onModeChange={setWorkMode}
            />
          )}

          {workMode !== "skip" && (
            <>
              <OptionCards label="Finalidade" description="Qual o foco principal do assistente" value={objectiveType}
                onChange={(v) => setObjectiveType(v as typeof objectiveType)} options={objectiveOptions}
                disabled={workMode === "default"}
              />
              <Field label="Vende o produto" placeholder="Ex: Matriz" value={productName} onChange={setProductName} disabled={workMode === "default"} />
              <Field label="Site oficial (opcional)" placeholder="https://vavive.com.br" value={jobSite} onChange={setJobSite} disabled={workMode === "default"} />
              <RichTextarea label="Descreva um pouco sobre sua franquia" placeholder="Fale sobre os servicos, diferenciais, regiao de atendimento..." value={jobDescription} onChange={setJobDescription} rows={4} disabled={workMode === "default"} />
            </>
          )}

          {workMode === "skip" && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Configuracao de trabalho nao sera aplicada.</p>
            </div>
          )}
        </div>
      ),
    },
    // Passo 3: Treinamentos
    {
      id: "trainings",
      title: "Treinamentos",
      description: "Conhecimento do assistente",
      isValid: true,
      content: (
        <div className="space-y-6">
          {hasStandardProfile && trainingsCount > 0 && (
            <StandardBanner
              label="Treinamentos definidos pelo SUPER_ADMIN"
              summary={trainingsSummary}
              preview={
                <ul className="space-y-1">
                  {trainings.slice(0, 5).map((t, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">[{t.type}]</span> {t.type === "TEXT" ? (t as { type: "TEXT"; text: string }).text.slice(0, 100) : t.type === "WEBSITE" ? (t as { type: "WEBSITE"; website: string }).website : t.type}
                    </li>
                  ))}
                  {trainings.length > 5 && <li className="text-xs">...e mais {trainings.length - 5}</li>}
                </ul>
              }
              mode={trainingsMode}
              onModeChange={setTrainingsMode}
            />
          )}

          {trainingsMode !== "skip" && (
            <>
              {trainingsMode === "default" && trainingsCount > 0 && (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Estes treinamentos serao aplicados ao assistente.</p>
              )}
              <TrainingEditor items={trainings} onChange={setTrainings} disabled={trainingsMode === "default"} />
            </>
          )}

          {trainingsMode === "skip" && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Treinamentos nao serao aplicados. Voce pode adicionar depois.</p>
            </div>
          )}
        </div>
      ),
    },
    // Passo 4: Intencoes
    {
      id: "intentions",
      title: "Intencoes",
      description: "O que o assistente deve fazer",
      isValid: true,
      content: (
        <div className="space-y-6">
          {hasStandardProfile && intentionsCount > 0 && (
            <StandardBanner
              label="Intencoes definidas pelo SUPER_ADMIN"
              summary={intentionsSummary}
              preview={
                <ul className="space-y-1">
                  {intentions.slice(0, 5).map((intent, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{intent.description}</span>
                      {intent.instructions && <span className="ml-1">— {intent.instructions.slice(0, 80)}{intent.instructions.length > 80 ? "..." : ""}</span>}
                    </li>
                  ))}
                  {intentions.length > 5 && <li className="text-xs">...e mais {intentions.length - 5}</li>}
                </ul>
              }
              mode={intentionsMode}
              onModeChange={setIntentionsMode}
            />
          )}

          {intentionsMode !== "skip" && (
            <>
              {intentionsMode === "default" && intentionsCount > 0 && (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Estas intencoes serao aplicadas ao assistente.</p>
              )}

              {intentions.length > 0 && (
                <div className="space-y-3">
                  {intentions.map((intent, i) => (
                    <div key={i} className="card p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{intent.description}</p>
                        {intent.instructions && <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{intent.instructions}</p>}
                        <div className="flex gap-2 mt-2">
                          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs" style={{ color: "var(--color-text-tertiary)" }}>{intent.type}</span>
                          {intent.type === "WEBHOOK" && <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs" style={{ color: "var(--color-text-tertiary)" }}>{intent.httpMethod}</span>}
                        </div>
                      </div>
                      {intentionsMode === "edit" && (
                        <button type="button" onClick={() => setIntentions((prev) => prev.filter((_, idx) => idx !== i))} className="text-sm text-red-500 hover:text-red-700 shrink-0">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {intentionsMode === "edit" && !showIntentionWizard && (
                <button type="button" onClick={() => setShowIntentionWizard(true)} className="btn-secondary">
                  <Plus size={16} /> Cadastrar intencao
                </button>
              )}

              {intentionsMode === "edit" && showIntentionWizard && (
                <div className="card p-6">
                  <IntentionWizard
                    onSave={(data) => {
                      setIntentions((prev) => [...prev, data]);
                      setShowIntentionWizard(false);
                    }}
                    onCancel={() => setShowIntentionWizard(false)}
                  />
                </div>
              )}
            </>
          )}

          {intentionsMode === "skip" && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Intencoes nao serao aplicadas. Voce pode adicionar depois.</p>
            </div>
          )}
        </div>
      ),
    },
    // Passo 5: Configuracoes
    {
      id: "settings",
      title: "Configuracoes",
      description: "Comportamento adicional",
      isValid: true,
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Comportamento</p>
            <ToggleField label="Usar emojis" description="Assistente pode usar emojis nas mensagens" checked={useEmojis} onChange={setUseEmojis} />
            <ToggleField label="Assinar mensagens" description="Adicionar nome do assistente no final" checked={signMessages} onChange={setSignMessages} />
            <ToggleField label="Limitar assuntos" description="Responder apenas sobre o escopo definido" checked={limitSubjects} onChange={setLimitSubjects} />
          </div>
        </div>
      ),
    },
    // Revisao
    {
      id: "review",
      title: "Revisar & Criar",
      description: "Confirme os dados",
      isValid: agentName.trim().length > 0,
      content: (
        <div className="space-y-6">
          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <User size={18} className="text-brand-500" />
              <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Perfil</h3>
              <span className={clsx("text-xs px-2 py-0.5 rounded-full", profileMode === "default" ? "bg-brand-100 text-brand-700" : profileMode === "skip" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700")}>
                {profileMode === "default" ? "Padrao" : profileMode === "skip" ? "Ignorado" : "Customizado"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <AssistantAvatar src={selectedAvatar === "random-gamified" ? buildGamifiedAvatarDataUri(agentName || "bot") : selectedAvatar || undefined} alt={agentName} fallbackLabel={agentName} className="h-10 w-10" />
              <div>
                <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{agentName}</p>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{communicationOptions.find(c => c.value === communicationType)?.label}</p>
              </div>
            </div>
            {profileMode !== "skip" && behavior && (
              <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--color-text-tertiary)" }}>{behavior}</p>
            )}
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Briefcase size={18} className="text-brand-500" />
              <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Trabalho</h3>
              <span className={clsx("text-xs px-2 py-0.5 rounded-full", workMode === "default" ? "bg-brand-100 text-brand-700" : workMode === "skip" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700")}>
                {workMode === "default" ? "Padrao" : workMode === "skip" ? "Ignorado" : "Customizado"}
              </span>
            </div>
            {workMode !== "skip" ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p style={{ color: "var(--color-text-tertiary)" }}>Finalidade</p><p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{objectiveOptions.find(o => o.value === objectiveType)?.label}</p></div>
                <div><p style={{ color: "var(--color-text-tertiary)" }}>Produto</p><p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{productName || franchise?.name || "-"}</p></div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Configuracao de trabalho ignorada.</p>
            )}
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen size={18} className="text-brand-500" />
              <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Treinamentos</h3>
              <span className={clsx("text-xs px-2 py-0.5 rounded-full", trainingsMode === "default" ? "bg-brand-100 text-brand-700" : trainingsMode === "skip" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700")}>
                {trainingsMode === "default" ? "Padrao" : trainingsMode === "skip" ? "Ignorado" : "Customizado"}
              </span>
            </div>
            {trainingsMode !== "skip" && trainings.length > 0 ? (
              <ul className="space-y-1">
                {trainings.slice(0, 5).map((t, i) => (
                  <li key={i} className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    • [{t.type}] {t.type === "TEXT" ? (t as { type: "TEXT"; text: string }).text.slice(0, 60) : t.type === "WEBSITE" ? (t as { type: "WEBSITE"; website: string }).website : t.type}
                  </li>
                ))}
                {trainings.length > 5 && <li className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>...e mais {trainings.length - 5}</li>}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>{trainingsMode === "skip" ? "Ignorados" : "Nenhum"}</p>
            )}
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Target size={18} className="text-brand-500" />
              <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Intencoes</h3>
              <span className={clsx("text-xs px-2 py-0.5 rounded-full", intentionsMode === "default" ? "bg-brand-100 text-brand-700" : intentionsMode === "skip" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700")}>
                {intentionsMode === "default" ? "Padrao" : intentionsMode === "skip" ? "Ignorado" : "Customizado"}
              </span>
            </div>
            {intentionsMode !== "skip" && intentions.length > 0 ? (
              <ul className="space-y-1">
                {intentions.slice(0, 5).map((intent, i) => (
                  <li key={i} className="text-sm" style={{ color: "var(--color-text-secondary)" }}>• {intent.description}</li>
                ))}
                {intentions.length > 5 && <li className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>...e mais {intentions.length - 5}</li>}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>{intentionsMode === "skip" ? "Ignoradas" : "Nenhuma"}</p>
            )}
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Settings size={18} className="text-brand-500" />
              <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Configuracoes</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {useEmojis && <span className="rounded-full bg-brand-100 text-brand-700 px-2 py-0.5 text-xs">Emojis</span>}
              {signMessages && <span className="rounded-full bg-brand-100 text-brand-700 px-2 py-0.5 text-xs">Assinar</span>}
              {limitSubjects && <span className="rounded-full bg-brand-100 text-brand-700 px-2 py-0.5 text-xs">Limitar assuntos</span>}
              {!useEmojis && !signMessages && !limitSubjects && <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Padrao</span>}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="Assistente" title={`Criar Assistente - ${franchise?.name ?? ""}`} description="Configure o assistente da franquia em 6 passos." />

      {error && (
        <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 mb-4">{error}</p>
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
        description="Esta acao substitui a configuracao atual do assistente."
        confirmLabel="Reconfigurar"
        onCancel={() => setConfirmAction(false)}
        onConfirm={() => { setConfirmAction(false); handleProvisionAgent(); }}
      />
    </AppShell>
  );
}
