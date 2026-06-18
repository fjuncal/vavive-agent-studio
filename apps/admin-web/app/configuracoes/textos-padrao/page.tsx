"use client";

import { AppShell } from "@/components/AppShell";
import { BlockEditor } from "@/components/BlockEditor";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import {
  getAssistantStandardProfile,
  updateAssistantStandardBlock,
  type AssistantBlock,
  type AssistantStandardProfile
} from "@/lib/api";
import { useEffect, useState } from "react";

export default function DefaultAgentTextsPage() {
  const { error: showError, success: showSuccess } = useToast();
  const [profile, setProfile] = useState<AssistantStandardProfile | null>(null);

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
        description="Configure os padroes globais que todas as franquias herdam."
      />

      {profile ? (
        <>
          <section className="card mb-6 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{profile.name}</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Versao ativa: {profile.version}</p>
              </div>
              {profile.updatedAt ? (
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  Ultima atualizacao: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(profile.updatedAt))}
                </p>
              ) : null}
            </div>
          </section>

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
        </>
      ) : null}
    </AppShell>
  );
}
