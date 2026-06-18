"use client";

import { Field } from "@/components/FormSection";
import { OptionCards, RichTextarea, SelectField, ToggleField } from "@/components/FriendlyForm";
import type { AssistantBlock } from "@/lib/api";
import { Eye, EyeOff, Lock, Save, Unlock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type BlockEditorProps = {
  block: AssistantBlock;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCustomize?: () => Promise<void>;
  onRestoreStandard?: () => Promise<void>;
  readOnly?: boolean;
  savingLabel?: string;
  customizeLabel?: string;
  restoreLabel?: string;
};

type EditableItem = Record<string, unknown>;

const modelOptions = [
  { value: "GPT_4_O", label: "GPT-4o" },
  { value: "GPT_4_O_MINI", label: "GPT-4o Mini" },
  { value: "GPT_5", label: "GPT-5" },
  { value: "CLAUDE_4_5_SONNET", label: "Claude 4.5 Sonnet" }
];

const communicationOptions = [
  { value: "FORMAL", label: "Formal", description: "Linguagem mais profissional" },
  { value: "NORMAL", label: "Normal", description: "Equilibrio entre proximidade e objetividade" },
  { value: "RELAXED", label: "Relaxado", description: "Mais casual e amigavel" }
];

const roleTypeOptions = [
  { value: "SALE", label: "Vendas", description: "Foco em conversao comercial" },
  { value: "SUPPORT", label: "Suporte", description: "Foco em ajuda e orientacao" },
  { value: "PERSONAL", label: "Atendimento geral", description: "Uso amplo da unidade" }
];

const groupingOptions = [
  { value: "NO_GROUP", label: "Nao agrupar" },
  { value: "30_SECONDS", label: "30 segundos" },
  { value: "1_MINUTE", label: "1 minuto" },
  { value: "5_MINUTES", label: "5 minutos" }
];

function asObject(value: Record<string, unknown> | undefined | null) {
  return value && typeof value === "object" ? value : {};
}

function asItems(value: unknown): EditableItem[] {
  return Array.isArray(value) ? value.filter((item): item is EditableItem => !!item && typeof item === "object") : [];
}

function ItemListEditor({
  label,
  description,
  items,
  onChange,
  factory,
  fields,
  readOnly
}: {
  label: string;
  description?: string;
  items: EditableItem[];
  onChange: (items: EditableItem[]) => void;
  factory: () => EditableItem;
  fields: Array<{ key: string; label: string; textarea?: boolean; rows?: number; placeholder?: string }>;
  readOnly: boolean;
}) {
  function updateItem(index: number, key: string, value: string) {
    const next = items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item));
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</p>
        {description ? <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>{description}</p> : null}
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {String(item.name || item.title || `Item ${index + 1}`)}
                </p>
                {!readOnly ? (
                  <button type="button" onClick={() => removeItem(index)} className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    Remover
                  </button>
                ) : null}
              </div>
              <div className="space-y-3">
                {fields.map((field) =>
                  field.textarea ? (
                    <RichTextarea
                      key={field.key}
                      label={field.label}
                      value={String(item[field.key] ?? "")}
                      onChange={(value) => updateItem(index, field.key, value)}
                      placeholder={field.placeholder}
                      rows={field.rows ?? 3}
                      disabled={readOnly}
                    />
                  ) : (
                    <Field
                      key={field.key}
                      label={field.label}
                      value={String(item[field.key] ?? "")}
                      onChange={(value) => updateItem(index, field.key, value)}
                      placeholder={field.placeholder}
                      disabled={readOnly}
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed px-4 py-5 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-tertiary)" }}>
          Nenhum item configurado.
        </div>
      )}
      {!readOnly ? (
        <button type="button" onClick={() => onChange([...items, factory()])} className="btn-secondary">
          Adicionar item
        </button>
      ) : null}
    </div>
  );
}

export function BlockEditor({
  block,
  onSave,
  onCustomize,
  onRestoreStandard,
  readOnly = false,
  savingLabel = "Salvar bloco",
  customizeLabel = "Customizar bloco",
  restoreLabel = "Voltar ao padrao"
}: BlockEditorProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>(block.payload ?? {});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setDraft(block.payload ?? {});
  }, [block]);

  const preview = useMemo(() => JSON.stringify(draft, null, 2), [draft]);
  const disabled = readOnly || !block.editable;

  function updateField(key: string, value: unknown) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateItems(items: EditableItem[]) {
    updateField("items", items);
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await onSave(draft);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar bloco.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCustomize() {
    if (!onCustomize) {
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onCustomize();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel customizar bloco.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRestoreStandard() {
    if (!onRestoreStandard) {
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onRestoreStandard();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel restaurar bloco.");
    } finally {
      setIsSaving(false);
    }
  }

  function renderForm() {
    switch (block.blockType) {
      case "BEHAVIOR":
        return (
          <div className="space-y-4">
            <RichTextarea
              label="Instrucao principal"
              value={String(draft.instruction ?? "")}
              onChange={(value) => updateField("instruction", value)}
              placeholder="Explique como o assistente deve responder e se comportar."
              rows={7}
              disabled={disabled}
            />
            <RichTextarea
              label="Resumo interno"
              value={String(draft.summary ?? "")}
              onChange={(value) => updateField("summary", value)}
              placeholder="Resumo curto do comportamento."
              rows={3}
              disabled={disabled}
            />
          </div>
        );
      case "ROLE":
        return (
          <div className="space-y-4">
            <Field label="Nome do trabalho" value={String(draft.jobName ?? "")} onChange={(value) => updateField("jobName", value)} disabled={disabled} />
            <SelectField
              label="Tom de comunicacao"
              value={String(draft.communicationType ?? "NORMAL")}
              onChange={(value) => updateField("communicationType", value)}
              options={communicationOptions}
              disabled={disabled}
            />
            <OptionCards
              label="Objetivo principal"
              value={String(draft.type ?? "SALE")}
              onChange={(value) => updateField("type", value)}
              options={roleTypeOptions}
              disabled={disabled}
            />
            <Field label="Nome publico do assistente" value={String(draft.assistantName ?? "")} onChange={(value) => updateField("assistantName", value)} disabled={disabled} />
            <Field label="Site da unidade" value={String(draft.jobSite ?? "")} onChange={(value) => updateField("jobSite", value)} disabled={disabled} />
            <RichTextarea
              label="Descricao do trabalho"
              value={String(draft.description ?? "")}
              onChange={(value) => updateField("description", value)}
              rows={4}
              disabled={disabled}
            />
          </div>
        );
      case "BASE_DESCRIPTION":
        return (
          <RichTextarea
            label="Descricao base"
            value={String(draft.text ?? "")}
            onChange={(value) => updateField("text", value)}
            placeholder="Base de contexto que ajuda o assistente a entender a unidade."
            rows={8}
            disabled={disabled}
          />
        );
      case "TRAININGS":
        return (
          <ItemListEditor
            label="Treinamentos padrao"
            description="Cada item vira uma base de conhecimento inicial."
            items={asItems(draft.items)}
            onChange={updateItems}
            factory={() => ({ title: "", content: "" })}
            fields={[
              { key: "title", label: "Titulo", placeholder: "Ex: Servicos da unidade" },
              { key: "content", label: "Conteudo", textarea: true, rows: 4, placeholder: "Descreva o treinamento." }
            ]}
            readOnly={disabled}
          />
        );
      case "INTENTIONS":
        return (
          <ItemListEditor
            label="Intencoes padrao"
            description="Configure gatilhos padrao para a unidade."
            items={asItems(draft.items)}
            onChange={updateItems}
            factory={() => ({ name: "", description: "", instructions: "" })}
            fields={[
              { key: "name", label: "Nome tecnico", placeholder: "Ex: agendar-visita" },
              { key: "description", label: "Descricao", placeholder: "Quando esta intencao deve ser usada" },
              { key: "instructions", label: "Instrucoes", textarea: true, rows: 4, placeholder: "O que o assistente deve fazer" }
            ]}
            readOnly={disabled}
          />
        );
      case "AGENT_SETTINGS":
        return (
          <div className="space-y-4">
            <SelectField
              label="Modelo"
              value={String(draft.prefferModel ?? "GPT_4_O")}
              onChange={(value) => updateField("prefferModel", value)}
              options={modelOptions}
              disabled={disabled}
            />
            <SelectField
              label="Fuso horario"
              value={String(draft.timezone ?? "America/Sao_Paulo")}
              onChange={(value) => updateField("timezone", value)}
              options={[
                { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
                { value: "America/Manaus", label: "America/Manaus" },
                { value: "America/Belem", label: "America/Belem" }
              ]}
              disabled={disabled}
            />
            <SelectField
              label="Agrupamento de mensagens"
              value={String(draft.messageGroupingTime ?? "NO_GROUP")}
              onChange={(value) => updateField("messageGroupingTime", value)}
              options={groupingOptions}
              disabled={disabled}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <ToggleField label="Transferencia humana" checked={Boolean(draft.enabledHumanTransfer)} onChange={(value) => updateField("enabledHumanTransfer", value)} disabled={disabled} />
              <ToggleField label="Lembretes" checked={Boolean(draft.enabledReminder)} onChange={(value) => updateField("enabledReminder", value)} disabled={disabled} />
              <ToggleField label="Separar mensagens" checked={Boolean(draft.splitMessages)} onChange={(value) => updateField("splitMessages", value)} disabled={disabled} />
              <ToggleField label="Usar emojis" checked={Boolean(draft.enabledEmoji)} onChange={(value) => updateField("enabledEmoji", value)} disabled={disabled} />
              <ToggleField label="Limitar assuntos" checked={Boolean(draft.limitSubjects)} onChange={(value) => updateField("limitSubjects", value)} disabled={disabled} />
              <ToggleField label="Assinar mensagens" checked={Boolean(draft.signMessages)} onChange={(value) => updateField("signMessages", value)} disabled={disabled} />
            </div>
          </div>
        );
      case "IDLE_ACTIONS":
        return (
          <ItemListEditor
            label="Acoes de inatividade"
            description="Configure respostas ou retomadas quando o cliente parar de responder."
            items={asItems(draft.items)}
            onChange={updateItems}
            factory={() => ({ name: "", description: "", instructions: "" })}
            fields={[
              { key: "name", label: "Nome", placeholder: "Ex: lembrete-30-min" },
              { key: "description", label: "Descricao", placeholder: "Quando acionar" },
              { key: "instructions", label: "Instrucoes", textarea: true, rows: 3, placeholder: "O que a automacao deve fazer" }
            ]}
            readOnly={disabled}
          />
        );
      case "TRANSFER_RULES":
        return (
          <ItemListEditor
            label="Regras de transferencia"
            description="Defina criterios para encaminhar o atendimento."
            items={asItems(draft.items)}
            onChange={updateItems}
            factory={() => ({ name: "", description: "", instructions: "" })}
            fields={[
              { key: "name", label: "Nome", placeholder: "Ex: transferir-lead-quente" },
              { key: "description", label: "Descricao", placeholder: "Quando transferir" },
              { key: "instructions", label: "Instrucoes", textarea: true, rows: 3, placeholder: "Como transferir o atendimento" }
            ]}
            readOnly={disabled}
          />
        );
    }
  }

  return (
    <article className="card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{block.title}</h3>
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
              {block.syncStatus === "REMOTE_SYNC" ? "Aplica na unidade" : block.syncStatus === "LOCAL_BLUEPRINT" ? "Configuracao local" : "Somente leitura"}
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{block.description}</p>
          <p className="mt-2 text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>{block.syncMessage}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-text-tertiary)" }}>
            v{block.standardVersion}
          </span>
          <button type="button" onClick={() => setShowPreview((current) => !current)} className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="mb-5 rounded-2xl border border-dashed p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-tertiary)" }}>
            Preview tecnico
          </p>
          <pre className="overflow-auto whitespace-pre-wrap text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {preview}
          </pre>
        </div>
      ) : null}

      {renderForm()}

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {!block.editable || readOnly ? null : block.locked && onCustomize ? (
          <button type="button" onClick={() => void handleCustomize()} disabled={isSaving} className="btn-secondary">
            <Unlock size={16} />
            {customizeLabel}
          </button>
        ) : (
          <>
            <button type="button" onClick={() => void handleSave()} disabled={isSaving || disabled} className="btn-primary">
              <Save size={16} />
              {isSaving ? "Salvando..." : savingLabel}
            </button>
            {onRestoreStandard ? (
              <button type="button" onClick={() => void handleRestoreStandard()} disabled={isSaving} className="btn-secondary">
                <Lock size={16} />
                {restoreLabel}
              </button>
            ) : null}
          </>
        )}
        {!block.editable ? (
          <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
            Este bloco fica visivel para referencia. Edicao remota entra na proxima fase.
          </div>
        ) : null}
      </div>
    </article>
  );
}
