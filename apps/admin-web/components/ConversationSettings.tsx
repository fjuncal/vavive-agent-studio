"use client";

import { SelectField, ToggleField } from "@/components/FriendlyForm";
import { Save } from "lucide-react";
import { useState } from "react";

const MODEL_OPTIONS = [
  { value: "GPT_5", label: "GPT-5" },
  { value: "GPT_5_MINI", label: "GPT-5 Mini" },
  { value: "GPT_4_O", label: "GPT-4o" },
  { value: "GPT_4_O_MINI", label: "GPT-4o Mini" },
  { value: "GPT_4_TURBO", label: "GPT-4 Turbo" },
  { value: "CLAUDE_4_5_SONNET", label: "Claude 4.5 Sonnet" },
  { value: "CLAUDE_3_5_SONNET", label: "Claude 3.5 Sonnet" },
  { value: "DEEPSEEK_CHAT", label: "DeepSeek Chat" },
  { value: "SABIA_3", label: "Sabia 3" },
];

const TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "(GMT-03:00) Sao Paulo" },
  { value: "America/Manaus", label: "(GMT-04:00) Manaus" },
  { value: "America/Belem", label: "(GMT-03:00) Belem" },
  { value: "America/Fortaleza", label: "(GMT-03:00) Fortaleza" },
  { value: "America/Bahia", label: "(GMT-03:00) Salvador" },
  { value: "America/Cuiaba", label: "(GMT-04:00) Cuiaba" },
  { value: "America/Campo_Grande", label: "(GMT-04:00) Campo Grande" },
];

const GROUPING_OPTIONS = [
  { value: "NO_GROUP", label: "Nao agrupar" },
  { value: "FIVE_SEC", label: "5 segundos" },
  { value: "TEN_SEC", label: "10 segundos" },
  { value: "THIRD_SEC", label: "30 segundos" },
  { value: "ONE_MINUTE", label: "1 minuto" },
];

const MAX_MESSAGES_OPTIONS = [
  { value: "null", label: "Sem limite" },
  { value: "20", label: "20 interacoes" },
  { value: "50", label: "50 interacoes" },
  { value: "100", label: "100 interacoes" },
  { value: "200", label: "200 interacoes" },
  { value: "500", label: "500 interacoes" },
  { value: "1000", label: "1000 interacoes" },
];

const LIMIT_ACTION_OPTIONS = [
  { value: "TEMP_BLOCK_30S", label: "Bloquear 30s" },
  { value: "TEMP_BLOCK_5M", label: "Bloquear 5min" },
  { value: "TEMP_BLOCK_10M", label: "Bloquear 10min" },
  { value: "TEMP_BLOCK_30M", label: "Bloquear 30min" },
  { value: "TEMP_BLOCK_1H", label: "Bloquear 1h" },
  { value: "BLOCK", label: "Bloquear permanentemente" },
  { value: "TRANSFER", label: "Transferir para humano" },
];

type ConversationSettingsProps = {
  settings: Record<string, unknown>;
  onSave: (settings: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
};

export function ConversationSettings({ settings, onSave, isSaving }: ConversationSettingsProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>(settings);

  function updateField(key: string, value: unknown) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await onSave(draft);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Modelo de IA"
          value={String(draft.prefferModel ?? "GPT_4_O")}
          onChange={(v) => updateField("prefferModel", v)}
          options={MODEL_OPTIONS}
        />
        <SelectField
          label="Timezone do agente"
          value={String(draft.timezone ?? "America/Sao_Paulo")}
          onChange={(v) => updateField("timezone", v)}
          options={TIMEZONE_OPTIONS}
        />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Preferencias da conversa</p>
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleField
            label="Transferencia humana"
            description="Habilite para que o agente possa transferir o atendimento para equipe humana"
            checked={Boolean(draft.enabledHumanTransfer)}
            onChange={(v) => updateField("enabledHumanTransfer", v)}
          />
          <ToggleField
            label="Lembretes"
            description="Permitir que o agente registre lembretes"
            checked={Boolean(draft.enabledReminder)}
            onChange={(v) => updateField("enabledReminder", v)}
          />
          <ToggleField
            label="Dividir resposta em partes"
            description="Separar mensagens longas em varias mensagens"
            checked={Boolean(draft.splitMessages)}
            onChange={(v) => updateField("splitMessages", v)}
          />
          <ToggleField
            label="Usar emojis nas respostas"
            description="Define se o agente pode utilizar emojis"
            checked={Boolean(draft.enabledEmoji)}
            onChange={(v) => updateField("enabledEmoji", v)}
          />
          <ToggleField
            label="Assinar nome do agente"
            description="Adicionar assinatura automatica em cada resposta"
            checked={Boolean(draft.signMessages)}
            onChange={(v) => updateField("signMessages", v)}
          />
          <ToggleField
            label="Restringir temas permitidos"
            description="Agente so fala sobre assuntos definidos"
            checked={Boolean(draft.limitSubjects)}
            onChange={(v) => updateField("limitSubjects", v)}
          />
          <ToggleField
            label="Busca inteligente do treinamento"
            description="Agente consulta base de treinamentos no momento certo"
            checked={Boolean(draft.knowledgeByFunction)}
            onChange={(v) => updateField("knowledgeByFunction", v)}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Agrupamento e limites</p>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Agrupamento de mensagens"
            value={String(draft.messageGroupingTime ?? "NO_GROUP")}
            onChange={(v) => updateField("messageGroupingTime", v)}
            options={GROUPING_OPTIONS}
          />
          <SelectField
            label="Limite de interacoes por atendimento"
            value={draft.maxDailyMessages == null ? "null" : String(draft.maxDailyMessages)}
            onChange={(v) => updateField("maxDailyMessages", v === "null" ? null : Number(v))}
            options={MAX_MESSAGES_OPTIONS}
          />
          {draft.maxDailyMessages != null && (
            <SelectField
              label="Acao ao atingir limite"
              value={String(draft.maxDailyMessagesLimitAction ?? "TRANSFER")}
              onChange={(v) => updateField("maxDailyMessagesLimitAction", v)}
              options={LIMIT_ACTION_OPTIONS}
            />
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="button" onClick={handleSave} disabled={isSaving} className="btn-primary">
          <Save size={16} />
          {isSaving ? "Salvando..." : "Salvar configuracoes"}
        </button>
      </div>
    </div>
  );
}
