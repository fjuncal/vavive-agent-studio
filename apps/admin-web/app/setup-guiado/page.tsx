"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import {
  customizeFranchiseAssistantBlock,
  getFranchiseAssistantConfiguration,
  getFranchises,
  updateFranchiseAssistantBlock,
  type AssistantBlock,
  type FranchiseAssistantConfiguration,
  type FranchiseSummary
} from "@/lib/api";
import { Lock, Save, Unlock } from "lucide-react";
import { useEffect, useState } from "react";

function BlockCard({
  franchiseId,
  block,
  onUpdated
}: {
  franchiseId: string;
  block: AssistantBlock;
  onUpdated: (next: FranchiseAssistantConfiguration) => void;
}) {
  const [draft, setDraft] = useState(JSON.stringify(block.payload ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(JSON.stringify(block.payload ?? {}, null, 2));
  }, [block]);

  async function handleCustomize() {
    setError(null);
    setIsSaving(true);
    try {
      onUpdated(await customizeFranchiseAssistantBlock(franchiseId, block.blockType));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel customizar bloco.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave(mode: "STANDARD" | "CUSTOM") {
    setError(null);
    setIsSaving(true);
    try {
      const payload = mode === "CUSTOM" ? JSON.parse(draft) : undefined;
      onUpdated(await updateFranchiseAssistantBlock(franchiseId, block.blockType, mode, payload));
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
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{block.title}</h2>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${block.mode === "STANDARD" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"}`}>
              {block.mode === "STANDARD" ? "Padrao da matriz" : "Personalizado"}
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
              block.syncStatus === "REMOTE_SYNC"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : block.syncStatus === "LOCAL_BLUEPRINT"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}>
              {block.syncStatus === "REMOTE_SYNC"
                ? "Aplica na unidade"
                : block.syncStatus === "LOCAL_BLUEPRINT"
                  ? "Configuracao local"
                  : "Somente leitura"}
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{block.description}</p>
          <p className="mt-2 text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>{block.syncMessage}</p>
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>
          v{block.standardVersion}
        </div>
      </div>

      <textarea
        className="input-field mt-4 min-h-[220px] font-mono text-sm leading-6"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={block.locked || !block.editable}
      />

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {!block.editable ? (
          <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
            Este bloco fica visivel para referencia. Edicao remota entra na proxima fase.
          </div>
        ) : block.locked ? (
          <button type="button" onClick={() => void handleCustomize()} disabled={isSaving} className="btn-secondary">
            <Unlock size={16} />
            Customizar bloco
          </button>
        ) : (
          <>
            <button type="button" onClick={() => void handleSave("CUSTOM")} disabled={isSaving} className="btn-primary">
              <Save size={16} />
              {isSaving ? "Salvando..." : "Salvar bloco"}
            </button>
            <button type="button" onClick={() => void handleSave("STANDARD")} disabled={isSaving} className="btn-secondary">
              <Lock size={16} />
              Voltar ao padrao
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function GuidedSetupPage() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [configuration, setConfiguration] = useState<FranchiseAssistantConfiguration | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    getFranchises()
      .then((items) => {
        setFranchises(items);
        const defaultId = user.role === "ADMIN_FRANQUIA" ? user.franchise?.id : items[0]?.id;
        if (defaultId) {
          setSelectedFranchiseId((current) => current || defaultId);
        }
      })
      .catch(() => setFranchises([]));
  }, [user]);

  useEffect(() => {
    if (!selectedFranchiseId) {
      return;
    }
    setError(null);
    getFranchiseAssistantConfiguration(selectedFranchiseId)
      .then(setConfiguration)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar workbench."));
  }, [selectedFranchiseId]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Assistente"
        title="Workbench do Assistente Vavive"
        description="Escolha por bloco entre padrao da matriz e configuracao propria da unidade."
      />

      {error ? <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}

      {user?.role !== "ADMIN_FRANQUIA" ? (
        <section className="card">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Franquia</span>
            <select className="input-field" value={selectedFranchiseId} onChange={(event) => setSelectedFranchiseId(event.target.value)}>
              {franchises.map((franchise) => (
                <option key={franchise.id} value={franchise.id}>{franchise.name}</option>
              ))}
            </select>
          </label>
        </section>
      ) : null}

      {configuration ? (
        <div className="grid gap-5">
          <section className="card">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{configuration.franchiseName}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {configuration.assistantConfigured ? `Assistente atual: ${configuration.assistantName}` : "Assistente ainda nao configurado na unidade."}
            </p>
          </section>

          {configuration.blocks.map((block) => (
            <BlockCard key={block.blockType} franchiseId={configuration.franchiseId} block={block} onUpdated={setConfiguration} />
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
