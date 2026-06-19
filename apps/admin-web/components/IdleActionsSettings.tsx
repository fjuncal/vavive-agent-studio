"use client";

import { Field } from "@/components/FormSection";
import { SelectField } from "@/components/FriendlyForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, Trash2, Clock } from "lucide-react";
import { useState } from "react";

const ACTION_TYPE_OPTIONS = [
  { value: "FINISH_INTERACTION", label: "Finalizar atendimento" },
  { value: "SEND_MESSAGE", label: "Enviar mensagem" },
];

const TIME_UNIT_OPTIONS = [
  { value: "60", label: "minutos" },
  { value: "3600", label: "horas" },
];

type IdleAction = {
  id?: string;
  type?: string;
  instructions?: string | null;
  seconds?: number;
  allowAllHours?: boolean;
};

type IdleActionsSettingsProps = {
  actions: IdleAction[];
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  onUpdate: (actionId: string, payload: Record<string, unknown>) => Promise<void>;
  onDelete: (actionId: string) => Promise<void>;
  isSaving: boolean;
};

export function IdleActionsSettings({ actions, onCreate, onUpdate, onDelete, isSaving }: IdleActionsSettingsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IdleAction | null>(null);
  const [formType, setFormType] = useState("FINISH_INTERACTION");
  const [formTimeValue, setFormTimeValue] = useState("10");
  const [formTimeUnit, setFormTimeUnit] = useState("60");
  const [formInstructions, setFormInstructions] = useState("");

  function resetForm() {
    setFormType("FINISH_INTERACTION");
    setFormTimeValue("10");
    setFormTimeUnit("60");
    setFormInstructions("");
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(action: IdleAction) {
    setEditingId(action.id ?? null);
    setFormType(action.type ?? "FINISH_INTERACTION");
    const secs = action.seconds ?? 600;
    if (secs >= 3600 && secs % 3600 === 0) {
      setFormTimeValue(String(secs / 3600));
      setFormTimeUnit("3600");
    } else {
      setFormTimeValue(String(Math.floor(secs / 60)));
      setFormTimeUnit("60");
    }
    setFormInstructions(action.instructions ?? "");
    setShowForm(true);
  }

  async function handleSave() {
    const seconds = Number(formTimeValue) * Number(formTimeUnit);
    const payload: Record<string, unknown> = {
      type: formType,
      seconds,
      instructions: formInstructions || null,
      allowAllHours: true,
    };
    if (editingId) {
      await onUpdate(editingId, payload);
    } else {
      await onCreate(payload);
    }
    resetForm();
  }

  function formatTime(seconds: number): string {
    if (seconds >= 3600 && seconds % 3600 === 0) {
      const h = seconds / 3600;
      return `${h} hora${h > 1 ? "s" : ""}`;
    }
    const m = Math.floor(seconds / 60);
    return `${m} minuto${m > 1 ? "s" : ""}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Configure acoes que o agente deve executar quando o cliente parar de responder.
        </p>
        <button type="button" onClick={() => setShowForm(true)} className="btn-secondary text-sm" disabled={isSaving}>
          <Plus size={14} />
          Adicionar acao
        </button>
      </div>

      {actions.length > 0 ? (
        <div className="space-y-3">
          {actions.map((action) => (
            <div key={action.id ?? Math.random()} className="card p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                  <Clock size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    Se nao responder em <span className="font-bold">{formatTime(action.seconds ?? 0)}</span>
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {action.type === "FINISH_INTERACTION" ? "Finalizar atendimento" : action.type === "SEND_MESSAGE" ? "Enviar mensagem" : action.type}
                    {action.instructions ? ` — ${action.instructions}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => openEdit(action)} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  Editar
                </button>
                <button type="button" onClick={() => setDeleteTarget(action)} className="text-xs font-medium text-red-500 hover:text-red-700">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma acao de inatividade configurada.</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
              {editingId ? "Editar acao" : "Nova acao de inatividade"}
            </h3>
            <div className="space-y-4">
              <SelectField
                label="Tipo de acao"
                value={formType}
                onChange={setFormType}
                options={ACTION_TYPE_OPTIONS}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Tempo"
                  value={formTimeValue}
                  onChange={setFormTimeValue}
                  placeholder="10"
                />
                <SelectField
                  label="Unidade"
                  value={formTimeUnit}
                  onChange={setFormTimeUnit}
                  options={TIME_UNIT_OPTIONS}
                />
              </div>
              {formType === "SEND_MESSAGE" && (
                <Field
                  label="Mensagem"
                  value={formInstructions}
                  onChange={setFormInstructions}
                  placeholder="Mensagem a ser enviada..."
                />
              )}
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
        title="Remover acao"
        description={`Tem certeza que deseja remover esta acao de inatividade?`}
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
