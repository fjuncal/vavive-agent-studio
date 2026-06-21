"use client";

import { AssistantAvatar, buildAssistantAvatarDataUri, buildGamifiedAvatarDataUri } from "@/components/AssistantAvatar";
import { Bot, User, Briefcase, BookOpen, Target, Settings, Sparkles } from "lucide-react";
import type { AssistantBlock } from "@/lib/api";

type AgentTemplatePreviewProps = {
  blocks: AssistantBlock[];
  className?: string;
};

export function AgentTemplatePreview({ blocks, className = "" }: AgentTemplatePreviewProps) {
  const roleBlock = blocks.find((b) => b.blockType === "ROLE");
  const behaviorBlock = blocks.find((b) => b.blockType === "BEHAVIOR");
  const trainingsBlock = blocks.find((b) => b.blockType === "TRAININGS");
  const intentionsBlock = blocks.find((b) => b.blockType === "INTENTIONS");
  const settingsBlock = blocks.find((b) => b.blockType === "AGENT_SETTINGS");

  const role = (roleBlock?.payload ?? {}) as Record<string, unknown>;
  const behavior = (behaviorBlock?.payload ?? {}) as Record<string, unknown>;
  const trainings = (trainingsBlock?.payload ?? {}) as Record<string, unknown>;
  const intentions = (intentionsBlock?.payload ?? {}) as Record<string, unknown>;
  const settings = (settingsBlock?.payload ?? {}) as Record<string, unknown>;

  const agentName = (role.assistantName as string) || "Assistente Vavive";
  const communicationType = (role.communicationType as string) || "NORMAL";
  const objectiveType = (role.type as string) || "SALE";
  const jobSite = (role.jobSite as string) || "";
  const description = (role.description as string) || "";
  const instruction = (behavior.instruction as string) || "";

  const trainingItems = Array.isArray(trainings.items) ? trainings.items : [];
  const intentionItems = Array.isArray(intentions.items) ? intentions.items : [];

  const avatarUri = buildGamifiedAvatarDataUri(agentName + "-template");

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <AssistantAvatar src={avatarUri} alt={agentName} fallbackLabel={agentName} className="h-16 w-16" />
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{agentName}</h3>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {communicationType === "FORMAL" ? "Formal" : communicationType === "RELAXED" ? "Descontraida" : "Normal"} | {objectiveType === "SALE" ? "Vendas" : objectiveType === "SUPPORT" ? "Suporte" : "Uso pessoal"}
            </p>
            {jobSite && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>{jobSite}</p>}
          </div>
        </div>
      </div>

      {/* Perfil */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-brand-500" />
          <h4 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Perfil</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span style={{ color: "var(--color-text-tertiary)" }}>Comunicacao: </span>
            <span style={{ color: "var(--color-text-primary)" }}>{communicationType}</span>
          </div>
          {instruction && (
            <div>
              <span style={{ color: "var(--color-text-tertiary)" }}>Comportamento: </span>
              <span style={{ color: "var(--color-text-primary)" }}>{instruction.slice(0, 150)}{instruction.length > 150 ? "..." : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* Trabalho */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase size={16} className="text-brand-500" />
          <h4 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Trabalho</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span style={{ color: "var(--color-text-tertiary)" }}>Finalidade: </span>
            <span style={{ color: "var(--color-text-primary)" }}>{objectiveType === "SALE" ? "Vendas" : objectiveType === "SUPPORT" ? "Suporte" : "Uso pessoal"}</span>
          </div>
          {description && (
            <div>
              <span style={{ color: "var(--color-text-tertiary)" }}>Descricao: </span>
              <span style={{ color: "var(--color-text-primary)" }}>{description.slice(0, 150)}{description.length > 150 ? "..." : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* Treinamentos */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-brand-500" />
          <h4 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Treinamentos ({trainingItems.length})</h4>
        </div>
        {trainingItems.length > 0 ? (
          <ul className="space-y-1">
            {trainingItems.slice(0, 3).map((item: Record<string, unknown>, i: number) => (
              <li key={i} className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <span className="font-medium">[{(item.type as string) || "TEXT"}]</span> {((item.text as string) || (item.content as string) || "").slice(0, 80)}
              </li>
            ))}
            {trainingItems.length > 3 && <li className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>...e mais {trainingItems.length - 3}</li>}
          </ul>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhum treinamento configurado</p>
        )}
      </div>

      {/* Intencoes */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-brand-500" />
          <h4 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Intencoes ({intentionItems.length})</h4>
        </div>
        {intentionItems.length > 0 ? (
          <ul className="space-y-1">
            {intentionItems.slice(0, 3).map((item: Record<string, unknown>, i: number) => (
              <li key={i} className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <span className="font-medium">{(item.name as string) || (item.description as string) || "Intencao"}</span>
                {item.instructions && <span className="ml-1">— {((item.instructions as string) || "").slice(0, 60)}</span>}
              </li>
            ))}
            {intentionItems.length > 3 && <li className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>...e mais {intentionItems.length - 3}</li>}
          </ul>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma intencao configurada</p>
        )}
      </div>

      {/* Configuracoes */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings size={16} className="text-brand-500" />
          <h4 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Configuracoes</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {(settings.enabledEmoji as boolean) && <span className="rounded-full bg-brand-100 text-brand-700 px-2 py-0.5 text-xs">Emojis</span>}
          {(settings.signMessages as boolean) && <span className="rounded-full bg-brand-100 text-brand-700 px-2 py-0.5 text-xs">Assinar</span>}
          {(settings.limitSubjects as boolean) && <span className="rounded-full bg-brand-100 text-brand-700 px-2 py-0.5 text-xs">Limitar assuntos</span>}
          {(settings.enabledHumanTransfer as boolean) && <span className="rounded-full bg-brand-100 text-brand-700 px-2 py-0.5 text-xs">Transferencia humana</span>}
          {(settings.enabledReminder as boolean) && <span className="rounded-full bg-brand-100 text-brand-700 px-2 py-0.5 text-xs">Lembretes</span>}
          {!(settings.enabledEmoji as boolean) && !(settings.signMessages as boolean) && !(settings.limitSubjects as boolean) && (
            <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Padrao</span>
          )}
        </div>
      </div>
    </div>
  );
}
