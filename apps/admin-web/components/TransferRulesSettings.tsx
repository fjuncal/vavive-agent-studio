"use client";

import { Field } from "@/components/FormSection";
import { ToggleField, SelectField } from "@/components/FriendlyForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, Trash2, ArrowRightLeft } from "lucide-react";
import { useState } from "react";

const TRANSFER_TYPE_OPTIONS = [
  { value: "AGENT", label: "Agente" },
  { value: "HUMAN", label: "Humano" },
];

type TransferRule = {
  id?: string;
  instructions?: string;
  returnOnFinish?: boolean;
  type?: string;
  agentId?: string | null;
  userId?: string | null;
};

type TransferRulesSettingsProps = {
  rules: TransferRule[];
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  onUpdate: (ruleId: string, payload: Record<string, unknown>) => Promise<void>;
  onDelete: (ruleId: string) => Promise<void>;
  isSaving: boolean;
};

export function TransferRulesSettings({ rules, onCreate, onUpdate, onDelete, isSaving }: TransferRulesSettingsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransferRule | null>(null);
  const [formType, setFormType] = useState("AGENT");
  const [formInstructions, setFormInstructions] = useState("");
  const [formReturnOnFinish, setFormReturnOnFinish] = useState(true);

  function resetForm() {
    setFormType("AGENT");
    setFormInstructions("");
    setFormReturnOnFinish(true);
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(rule: TransferRule) {
    setEditingId(rule.id ?? null);
    setFormType(rule.type ?? "AGENT");
    setFormInstructions(rule.instructions ?? "");
    setFormReturnOnFinish(rule.returnOnFinish ?? true);
    setShowForm(true);
  }

  async function handleSave() {
    const payload: Record<string, unknown> = {
      type: formType,
      instructions: formInstructions,
      returnOnFinish: formReturnOnFinish,
    };
    if (editingId) {
      await onUpdate(editingId, payload);
    } else {
      await onCreate(payload);
    }
    resetForm();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Configure instrucoes para o agente fazer transferencia do atendimento.
        </p>
        <button type="button" onClick={() => setShowForm(true)} className="btn-secondary text-sm" disabled={isSaving}>
          <Plus size={14} />
          Adicionar regra
        </button>
      </div>

      {rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id ?? Math.random()} className="card p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <ArrowRightLeft size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    Transferir para: {rule.type === "AGENT" ? "Agente" : "Humano"}
                    {rule.returnOnFinish ? " (Retornar ao finalizar)" : ""}
                  </p>
                  {rule.instructions && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                      {rule.instructions}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => openEdit(rule)} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  Editar
                </button>
                <button type="button" onClick={() => setDeleteTarget(rule)} className="text-xs font-medium text-red-500 hover:text-red-700">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma regra de transferencia configurada.</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
              {editingId ? "Editar regra" : "Nova regra de transferencia"}
            </h3>
            <div className="space-y-4">
              <SelectField
                label="Transferir para"
                value={formType}
                onChange={setFormType}
                options={TRANSFER_TYPE_OPTIONS}
              />
              <Field
                label="Instrucoes"
                value={formInstructions}
                onChange={setFormInstructions}
                placeholder="Quando o cliente quiser falar sobre tal assunto..."
              />
              <ToggleField
                label="Retornar ao finalizar"
                description="Devolver ao assistente quando atendimento humano terminar"
                checked={formReturnOnFinish}
                onChange={setFormReturnOnFinish}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
                <button type="button" onClick={handleSave} disabled={isSaving} className="btn-primary">
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remover regra"
        description="Tem certeza que deseja remover esta regra de transferencia?"
        confirmLabel="Remover"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget?.id) {
            await onDelete(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
