"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Settings2, X } from "lucide-react";

type ChannelConfigPayload = Record<string, unknown>;

interface ChannelConfigModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  initialPayload?: ChannelConfigPayload | null;
  isLoading?: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (payload: ChannelConfigPayload) => Promise<void> | void;
}

const tabs = [
  { id: "conversation", label: "Conversa" },
  { id: "groups", label: "Grupos" },
  { id: "private", label: "Chat Privado" },
  { id: "calls", label: "Ligacoes" },
  { id: "takeover", label: "Assumir Atendimento" },
  { id: "waiting", label: "Waiting Message" }
] as const;

type TabId = typeof tabs[number]["id"];

const DEFAULT_PAYLOAD: ChannelConfigPayload = {
  enabledTyping: false,
  autoReadMessages: false,
  audioAction: "RESPOND",
  startTrigger: "ALWAYS",
  endTrigger: "NEVER",
  enableGroupsResponse: false,
  replyGroupsType: "IGNORE",
  enablePrivateChatResponse: true,
  callRejectAuto: true,
  callRejectMessage: "Desculpe, mas este canal nao aceita chamadas telefonicas, apenas comunicacoes por meio de texto.",
  takeOutsideService: false,
  waitingMessageEnabled: false,
  waitingMessageText: "oi",
};

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function textValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function payloadWithDefaults(payload?: ChannelConfigPayload | null) {
  return { ...DEFAULT_PAYLOAD, ...(payload ?? {}) };
}

export function ChannelConfigModal({
  isOpen,
  title,
  subtitle,
  initialPayload,
  isLoading = false,
  isSaving = false,
  onClose,
  onSave
}: ChannelConfigModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("conversation");
  const [draft, setDraft] = useState<ChannelConfigPayload>(payloadWithDefaults(initialPayload));

  useEffect(() => {
    if (isOpen) {
      setDraft(payloadWithDefaults(initialPayload));
      setActiveTab("conversation");
    }
  }, [initialPayload, isOpen]);

  const payload = useMemo(() => payloadWithDefaults(draft), [draft]);

  if (!isOpen) {
    return null;
  }

  const setBoolean = (key: string, value: boolean) => setDraft((current) => ({ ...current, [key]: value }));
  const setText = (key: string, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <Settings2 size={18} className="text-brand-500" />
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
            </div>
            {subtitle ? (
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[220px_1fr]">
          <aside className="border-b border-gray-100 p-4 dark:border-gray-800 md:border-b-0 md:border-r">
            <div className="grid gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="min-h-0 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <Loader2 size={16} className="animate-spin" />
                Carregando configuracoes...
              </div>
            ) : null}

            {!isLoading && activeTab === "conversation" ? (
              <div className="space-y-5">
                <ToggleRow
                  label="Indicador de Digitacao"
                  description='Mostra "digitando..." no WhatsApp'
                  checked={boolValue(payload.enabledTyping, false)}
                  onChange={(value) => setBoolean("enabledTyping", value)}
                />
                <ToggleRow
                  label="Leitura Automatica"
                  description="Marca mensagens como lidas"
                  checked={boolValue(payload.autoReadMessages, false)}
                  onChange={(value) => setBoolean("autoReadMessages", value)}
                />
                <SelectRow
                  label="Processamento de Audio"
                  value={textValue(payload.audioAction, "RESPOND")}
                  onChange={(value) => setText("audioAction", value)}
                  options={[
                    { value: "RESPOND", label: "Responder" },
                    { value: "TRANSCRIBE", label: "Transcrever" },
                    { value: "DISABLED", label: "Ignorar" }
                  ]}
                />
                <SelectRow
                  label="Ativacao do Agente"
                  value={textValue(payload.startTrigger, "ALWAYS")}
                  onChange={(value) => setText("startTrigger", value)}
                  options={[
                    { value: "ALWAYS", label: "Sempre responder" },
                    { value: "ONLY_WHEN_CALLING_BY_NAME", label: "So quando chamado" }
                  ]}
                />
                <SelectRow
                  label="Encerramento da Conversa"
                  value={textValue(payload.endTrigger, "NEVER")}
                  onChange={(value) => setText("endTrigger", value)}
                  options={[
                    { value: "NEVER", label: "Nunca parar" },
                    { value: "WHEN_SAY_GOODBYE", label: "Ao se despedir" }
                  ]}
                />
              </div>
            ) : null}

            {!isLoading && activeTab === "groups" ? (
              <div className="space-y-5">
                <SelectRow
                  label="Mensagens de grupos"
                  help="Caso queira tambem aceitar mensagens de grupos, ative essa opcao"
                  value={textValue(payload.replyGroupsType, boolValue(payload.enableGroupsResponse, false) ? "RESPOND" : "IGNORE")}
                  onChange={(value) => {
                    setText("replyGroupsType", value);
                    setBoolean("enableGroupsResponse", value !== "IGNORE");
                  }}
                  options={[
                    { value: "IGNORE", label: "Ignorar mensagens em grupo" },
                    { value: "RESPOND", label: "Responder grupos normalmente" }
                  ]}
                />
              </div>
            ) : null}

            {!isLoading && activeTab === "private" ? (
              <div className="space-y-5">
                <SelectRow
                  label="Resposta em Chat Privado"
                  help="Configure se o agente deve responder mensagens privadas no WhatsApp"
                  value={boolValue(payload.enablePrivateChatResponse, true) ? "RESPOND" : "IGNORE"}
                  onChange={(value) => setBoolean("enablePrivateChatResponse", value === "RESPOND")}
                  options={[
                    { value: "RESPOND", label: "Responder chat privado" },
                    { value: "IGNORE", label: "Ignorar chat privado" }
                  ]}
                />
              </div>
            ) : null}

            {!isLoading && activeTab === "calls" ? (
              <div className="space-y-5">
                <SelectRow
                  label="Gerenciamento de Chamadas"
                  help="Configure como o agente deve tratar chamadas recebidas no WhatsApp"
                  value={boolValue(payload.callRejectAuto, true) ? "REJECT" : "NONE"}
                  onChange={(value) => setBoolean("callRejectAuto", value === "REJECT")}
                  options={[
                    { value: "REJECT", label: "Rejeitar chamadas automaticamente" },
                    { value: "NONE", label: "Nao fazer nenhuma acao" }
                  ]}
                />
                <TextAreaRow
                  label="Mensagem de Resposta"
                  help="Mensagem enviada automaticamente quando uma chamada for rejeitada"
                  value={textValue(payload.callRejectMessage, textValue(DEFAULT_PAYLOAD.callRejectMessage, ""))}
                  onChange={(value) => setText("callRejectMessage", value)}
                />
              </div>
            ) : null}

            {!isLoading && activeTab === "takeover" ? (
              <div className="space-y-5">
                <ToggleRow
                  label="Assumir via Celular"
                  description="Permite que humanos assumam conversas atraves do aplicativo movel"
                  checked={boolValue(payload.takeOutsideService, false)}
                  onChange={(value) => setBoolean("takeOutsideService", value)}
                />
              </div>
            ) : null}

            {!isLoading && activeTab === "waiting" ? (
              <div className="space-y-5">
                <ToggleRow
                  label="Mensagens Nao Descriptografadas"
                  description='Como tratar mensagens que ficam "aguardando mensagem" por erro de criptografia'
                  checked={boolValue(payload.waitingMessageEnabled, false)}
                  onChange={(value) => setBoolean("waitingMessageEnabled", value)}
                />
                <TextAreaRow
                  label="Texto Substituto"
                  help="Texto que o agente deve considerar quando receber mensagens nao descriptografadas"
                  value={textValue(payload.waitingMessageText, "oi")}
                  onChange={(value) => setText("waitingMessageText", value)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 p-4 dark:border-gray-800">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="button" onClick={() => onSave(payload)} disabled={isLoading || isSaving} className="btn-primary">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            Salvar configuracoes
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-6 w-11 rounded-full transition ${checked ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-700"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function SelectRow({
  label,
  help,
  value,
  onChange,
  options
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</span>
      {help ? <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{help}</span> : null}
      <select className="input-field" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function TextAreaRow({
  label,
  help,
  value,
  onChange
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</span>
      {help ? <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{help}</span> : null}
      <textarea className="input-field min-h-[120px]" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
