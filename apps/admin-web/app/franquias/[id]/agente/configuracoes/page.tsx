"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getAgentSettings, updateAgentSettings } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type MessageGroupingTime = "NO_GROUP" | "FIVE_SEC" | "TEN_SEC" | "THIRD_SEC" | "ONE_MINUTE";

type MaxDailyMessages = null | 20 | 50 | 100 | 200 | 500 | 1000;

interface AgentSettings {
  prefferModel: string;
  timezone: string;
  enabledHumanTransfer: boolean;
  enabledReminder: boolean;
  splitMessages: boolean;
  enabledEmoji: boolean;
  limitSubjects: boolean;
  messageGroupingTime: MessageGroupingTime;
  maxDailyMessages: MaxDailyMessages;
  signMessages: boolean;
}

const defaultSettings: AgentSettings = {
  prefferModel: "GPT_4_O",
  timezone: "America/Sao_Paulo",
  enabledHumanTransfer: false,
  enabledReminder: false,
  splitMessages: false,
  enabledEmoji: false,
  limitSubjects: false,
  messageGroupingTime: "NO_GROUP",
  maxDailyMessages: null,
  signMessages: false
};

const modelOptions = [
  { value: "GPT_4_O", label: "GPT-4o" },
  { value: "GPT_5", label: "GPT-5" },
  { value: "CLAUDE_4_5_SONNET", label: "Claude 4.5 Sonnet" },
  { value: "CLAUDE_SONNET_4", label: "Claude Sonnet 4" },
  { value: "GPT_4_1_MINI", label: "GPT-4.1 Mini" },
  { value: "GEMINI_2_5_PRO", label: "Gemini 2.5 Pro" }
];

const timezoneOptions = [
  "America/Sao_Paulo",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Argentina/Buenos_Aires",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Lisbon",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland"
];

const groupingOptions: { value: MessageGroupingTime; label: string }[] = [
  { value: "NO_GROUP", label: "Sem agrupamento" },
  { value: "FIVE_SEC", label: "5 segundos" },
  { value: "TEN_SEC", label: "10 segundos" },
  { value: "THIRD_SEC", label: "30 segundos" },
  { value: "ONE_MINUTE", label: "1 minuto" }
];

const dailyLimitOptions: { value: string; label: string }[] = [
  { value: "", label: "Sem limite" },
  { value: "20", label: "20 mensagens" },
  { value: "50", label: "50 mensagens" },
  { value: "100", label: "100 mensagens" },
  { value: "200", label: "200 mensagens" },
  { value: "500", label: "500 mensagens" },
  { value: "1000", label: "1000 mensagens" }
];

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
      <div className="grid gap-0.5">
        <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</span>
        <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{description}</span>
      </div>
    </label>
  );
}

export default function AgentSettingsPage() {
  const params = useParams<{ id: string }>();
  const [settings, setSettings] = useState<AgentSettings>(defaultSettings);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    setIsLoading(true);
    getAgentSettings(params.id)
      .then((data) => {
        setSettings({
          prefferModel: (data.prefferModel as string) ?? defaultSettings.prefferModel,
          timezone: (data.timezone as string) ?? defaultSettings.timezone,
          enabledHumanTransfer: (data.enabledHumanTransfer as boolean) ?? defaultSettings.enabledHumanTransfer,
          enabledReminder: (data.enabledReminder as boolean) ?? defaultSettings.enabledReminder,
          splitMessages: (data.splitMessages as boolean) ?? defaultSettings.splitMessages,
          enabledEmoji: (data.enabledEmoji as boolean) ?? defaultSettings.enabledEmoji,
          limitSubjects: (data.limitSubjects as boolean) ?? defaultSettings.limitSubjects,
          messageGroupingTime: (data.messageGroupingTime as MessageGroupingTime) ?? defaultSettings.messageGroupingTime,
          maxDailyMessages: (data.maxDailyMessages as MaxDailyMessages) ?? defaultSettings.maxDailyMessages,
          signMessages: (data.signMessages as boolean) ?? defaultSettings.signMessages
        });
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "NÃ£o foi possÃ­vel carregar as configuraÃ§Ãµes do agente.");
      })
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  function updateField<K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!params?.id) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateAgentSettings(params.id, settings as unknown as Record<string, unknown>);
      setSuccess("ConfiguraÃ§Ãµes salvas com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "NÃ£o foi possÃ­vel salvar as configuraÃ§Ãµes.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Agente"
        title="ConfiguraÃ§Ãµes do agente"
        description="Ajuste o modelo, comportamento e limites do agente."
        backHref={`/franquias/${params?.id}/agente`}
      />

      {error ? <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{success}</p> : null}

      {isLoading ? (
        <section className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando configuraÃ§Ãµes...</p>
        </section>
      ) : (
        <form onSubmit={handleSave} className="grid gap-5">
          {/* Modelo e Timezone */}
          <section className="card">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Modelo e RegiÃ£o</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Defina o modelo de linguagem e o fuso horÃ¡rio do agente.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Modelo preferido</span>
                <select
                  className="input-field"
                  value={settings.prefferModel}
                  onChange={(event) => updateField("prefferModel", event.target.value)}
                >
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Fuso horÃ¡rio</span>
                <select
                  className="input-field"
                  value={settings.timezone}
                  onChange={(event) => updateField("timezone", event.target.value)}
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>{tz.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* Comportamento */}
          <section className="card">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Comportamento</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Controle como o agente interage com os clientes.</p>
            <div className="mt-5 grid gap-5">
              <Toggle
                label="TransferÃªncia para humano"
                description="Permite que o agente transfira a conversa para um atendente humano."
                checked={settings.enabledHumanTransfer}
                onChange={(value) => updateField("enabledHumanTransfer", value)}
              />
              <Toggle
                label="Lembretes automÃ¡ticos"
                description="Envia lembretes automÃ¡ticos para conversas inativas."
                checked={settings.enabledReminder}
                onChange={(value) => updateField("enabledReminder", value)}
              />
              <Toggle
                label="Dividir mensagens"
                description="Divide mensagens longas em mÃºltiplas mensagens curtas."
                checked={settings.splitMessages}
                onChange={(value) => updateField("splitMessages", value)}
              />
              <Toggle
                label="Usar emojis"
                description="Permite que o agente use emojis nas respostas."
                checked={settings.enabledEmoji}
                onChange={(value) => updateField("enabledEmoji", value)}
              />
              <Toggle
                label="Limitar assuntos"
                description="Restringe o agente a responder apenas sobre assuntos permitidos."
                checked={settings.limitSubjects}
                onChange={(value) => updateField("limitSubjects", value)}
              />
              <Toggle
                label="Assinar mensagens"
                description="Adiciona a assinatura do agente ao final das mensagens."
                checked={settings.signMessages}
                onChange={(value) => updateField("signMessages", value)}
              />
            </div>
          </section>

          {/* Agrupamento e Limites */}
          <section className="card">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Agrupamento e Limites</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Configure agrupamento de mensagens e limites diÃ¡rios.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Agrupamento de mensagens</span>
                <select
                  className="input-field"
                  value={settings.messageGroupingTime}
                  onChange={(event) => updateField("messageGroupingTime", event.target.value as MessageGroupingTime)}
                >
                  {groupingOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  Agrupa mensagens consecutivas do cliente em uma Ãºnica entrega.
                </span>
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Limite diÃ¡rio de mensagens</span>
                <select
                  className="input-field"
                  value={settings.maxDailyMessages === null ? "" : String(settings.maxDailyMessages)}
                  onChange={(event) => updateField("maxDailyMessages", event.target.value === "" ? null : Number(event.target.value) as MaxDailyMessages)}
                >
                  {dailyLimitOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  NÃºmero mÃ¡ximo de mensagens enviadas pelo agente por dia.
                </span>
              </label>
            </div>
          </section>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary disabled:cursor-wait disabled:opacity-70"
            >
              {isSaving ? "Salvando..." : "Salvar configuraÃ§Ãµes"}
            </button>
          </div>
        </form>
      )}
    </AppShell>
  );
}
