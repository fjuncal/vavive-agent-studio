"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import {
  getAssistantStandardProfile,
  updateAssistantStandardBlock,
  type AssistantBlock,
  type AssistantStandardProfile
} from "@/lib/api";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";

function BlockEditor({
  block,
  onSave
}: {
  block: AssistantBlock;
  onSave: (nextPayload: Record<string, unknown>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(JSON.stringify(block.payload ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(JSON.stringify(block.payload ?? {}, null, 2));
  }, [block]);

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await onSave(JSON.parse(draft));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar bloco.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{block.title}</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{block.description}</p>
          <p className="mt-2 text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>{block.syncMessage}</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>
          v{block.standardVersion}
        </span>
      </div>
      <textarea
        className="input-field mt-4 min-h-[220px] font-mono text-sm leading-6"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={() => void handleSave()} disabled={isSaving} className="btn-primary">
          <Save size={16} />
          {isSaving ? "Salvando..." : "Salvar bloco"}
        </button>
      </div>
    </article>
  );
}

export default function DefaultAgentTextsPage() {
  const [profile, setProfile] = useState<AssistantStandardProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAssistantStandardProfile()
      .then(setProfile)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar padroes."));
  }, []);

  async function handleSaveBlock(block: AssistantBlock, payload: Record<string, unknown>) {
    const updated = await updateAssistantStandardBlock(block.blockType, payload);
    setProfile(updated);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Matriz"
        title="Padroes do Assistente Vavive"
        description="Padrao global por bloco. Franquias em modo padrao recebem atualizacao automatica."
      />

      {error ? <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}

      {profile ? (
        <div className="grid gap-5">
          <section className="card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{profile.name}</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Versao ativa {profile.version}</p>
              </div>
            </div>
          </section>
          {profile.blocks.map((block) => (
            <BlockEditor key={block.blockType} block={block} onSave={(payload) => handleSaveBlock(block, payload)} />
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
