"use client";

import { AppShell } from "@/components/AppShell";
import { AgentTemplatePreview } from "@/components/AgentTemplatePreview";
import { BlockEditor } from "@/components/BlockEditor";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import {
  getAssistantStandardProfile,
  updateAssistantStandardBlock,
  type AssistantBlock,
  type AssistantStandardProfile
} from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function DefaultAgentTextsPage() {
  const { error: showError, success: showSuccess } = useToast();
  const [profile, setProfile] = useState<AssistantStandardProfile | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    getAssistantStandardProfile()
      .then(setProfile)
      .catch((requestError) => showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar padroes."));
  }, [showError]);

  async function handleSaveBlock(block: AssistantBlock, payload: Record<string, unknown>) {
    const updated = await updateAssistantStandardBlock(block.blockType, payload);
    setProfile(updated);
    showSuccess(`Bloco "${block.title}" salvo com sucesso.`);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Matriz"
        title="Padroes do Assistente Vavive"
        description="Configure os padroes globais que todas as franquias herdam. O que voce definir aqui sera usado como base na criacao de novos agentes."
      />

      {profile ? (
        <>
          <section className="card mb-6 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{profile.name}</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Versao ativa: {profile.version}</p>
              </div>
              <div className="flex items-center gap-3">
                {profile.updatedAt ? (
                  <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                    Ultima atualizacao: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(profile.updatedAt))}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn-secondary flex items-center gap-2"
                >
                  {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showPreview ? "Ocultar preview" : "Mostrar preview"}
                </button>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            {/* Editor */}
            <div className="space-y-6">
              {profile.blocks.map((block) => (
                <BlockEditor
                  key={block.blockType}
                  block={block}
                  onSave={(payload) => handleSaveBlock(block, payload)}
                  readOnly={false}
                />
              ))}
            </div>

            {/* Preview */}
            {showPreview && (
              <aside className="space-y-4">
                <div className="sticky top-6">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                    Preview do agente padrao
                  </h3>
                  <p className="text-xs mb-4" style={{ color: "var(--color-text-tertiary)" }}>
                    Assim o agente aparecera para o franqueado ao criar um novo assistente.
                  </p>
                  <AgentTemplatePreview blocks={profile.blocks} />
                </div>
              </aside>
            )}
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
