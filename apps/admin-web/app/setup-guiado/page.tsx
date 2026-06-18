"use client";

import { AppShell } from "@/components/AppShell";
import { BlockEditor } from "@/components/BlockEditor";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
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
import { useEffect, useState } from "react";

export default function GuidedSetupPage() {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [configuration, setConfiguration] = useState<FranchiseAssistantConfiguration | null>(null);

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
      .catch((requestError) => showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar franquias."));
  }, [showError, user]);

  useEffect(() => {
    if (!selectedFranchiseId) {
      return;
    }
    getFranchiseAssistantConfiguration(selectedFranchiseId)
      .then(setConfiguration)
      .catch((requestError) => showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar workbench."));
  }, [selectedFranchiseId, showError]);

  async function refreshConfiguration(next: Promise<FranchiseAssistantConfiguration>, message?: string) {
    const updated = await next;
    setConfiguration(updated);
    if (message) {
      showSuccess(message);
    }
  }

  async function handleSaveBlock(block: AssistantBlock, payload: Record<string, unknown>) {
    if (!configuration) {
      return;
    }
    await refreshConfiguration(
      updateFranchiseAssistantBlock(configuration.franchiseId, block.blockType, "CUSTOM", payload),
      `Bloco "${block.title}" salvo para a unidade.`
    );
  }

  async function handleCustomizeBlock(block: AssistantBlock) {
    if (!configuration) {
      return;
    }
    await refreshConfiguration(
      customizeFranchiseAssistantBlock(configuration.franchiseId, block.blockType),
      `Bloco "${block.title}" agora esta personalizado.`
    );
  }

  async function handleRestoreBlock(block: AssistantBlock) {
    if (!configuration) {
      return;
    }
    await refreshConfiguration(
      updateFranchiseAssistantBlock(configuration.franchiseId, block.blockType, "STANDARD"),
      `Bloco "${block.title}" voltou para o padrao da matriz.`
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Assistente"
        title="Workbench do Assistente Vavive"
        description="Escolha por bloco entre padrao da matriz e configuracao propria da unidade."
      />

      {user?.role !== "ADMIN_FRANQUIA" ? (
        <section className="card mb-5">
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
            <BlockEditor
              key={block.blockType}
              block={block}
              onSave={(payload) => handleSaveBlock(block, payload)}
              onCustomize={() => handleCustomizeBlock(block)}
              onRestoreStandard={() => handleRestoreBlock(block)}
            />
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
