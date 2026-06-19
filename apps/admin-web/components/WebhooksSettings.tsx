"use client";

import { Field } from "@/components/FormSection";
import { Save, Webhook } from "lucide-react";
import { useState } from "react";

const WEBHOOK_EVENTS = [
  { key: "onNewMessage", label: "Nova mensagem", description: "Quando uma nova mensagem chega em um chat" },
  { key: "onLackKnowLedge", label: "Falta de conhecimento", description: "Quando o agente nao sabe responder" },
  { key: "onTransfer", label: "Transferencia", description: "Quando o agente transfere para humano" },
  { key: "onFirstInteraction", label: "Primeira interacao", description: "Quando o primeiro atendimento e iniciado" },
  { key: "onStartInteraction", label: "Inicio de atendimento", description: "Quando qualquer atendimento e iniciado" },
  { key: "onFinishInteraction", label: "Fim de atendimento", description: "Quando um atendimento e finalizado" },
  { key: "onCreateEvent", label: "Agendamento criado", description: "Quando um agendamento e realizado" },
  { key: "onCancelEvent", label: "Agendamento cancelado", description: "Quando um agendamento e cancelado" },
];

type WebhooksSettingsProps = {
  webhooks: Record<string, unknown>;
  onSave: (webhooks: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
};

export function WebhooksSettings({ webhooks, onSave, isSaving }: WebhooksSettingsProps) {
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const event of WEBHOOK_EVENTS) {
      initial[event.key] = typeof webhooks[event.key] === "string" ? (webhooks[event.key] as string) : "";
    }
    return initial;
  });

  function updateField(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const payload: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(draft)) {
      payload[key] = value.trim() || null;
    }
    await onSave(payload);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Escute eventos que acontecem no sistema e tome acoes como enviar um webhook.
      </p>

      <div className="space-y-4">
        {WEBHOOK_EVENTS.map((event) => (
          <div key={event.key} className="card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <Webhook size={14} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{event.label}</p>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{event.description}</p>
              </div>
            </div>
            <Field
              label="URL"
              value={draft[event.key] ?? ""}
              onChange={(v) => updateField(event.key, v)}
              placeholder="https://exemplo.com/webhook"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button type="button" onClick={handleSave} disabled={isSaving} className="btn-primary">
          <Save size={16} />
          {isSaving ? "Salvando..." : "Salvar webhooks"}
        </button>
      </div>
    </div>
  );
}
