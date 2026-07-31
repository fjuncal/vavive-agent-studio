"use client";

import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ConversationSettings } from "@/components/ConversationSettings";
import { Field } from "@/components/FormSection";
import { IdleActionsSettings } from "@/components/IdleActionsSettings";
import { OptionCards, RichTextarea, SelectField, ToggleField } from "@/components/FriendlyForm";
import { PageHeader } from "@/components/PageHeader";
import { StatusDropdown } from "@/components/StatusDropdown";
import { TabConfig, type TabItem } from "@/components/TabConfig";
import { useToast } from "@/components/Toast";
import { TransferRulesSettings } from "@/components/TransferRulesSettings";
import { WebhooksSettings } from "@/components/WebhooksSettings";
import {
  activateAgent,
  clearFranchiseAgent,
  createGptMakerIntention,
  createGptMakerTraining,
  createIdleAction,
  createTransferRule,
  customizeFranchiseAssistantBlock,
  deleteGptMakerIntention,
  deleteGptMakerTraining,
  deleteIdleAction,
  deleteTransferRule,
  getAgentSettings,
  getAgentWebhooks,
  getFranchiseAssistantConfiguration,
  getFranchiseById,
  getFranchiseGptMakerConnection,
  getGptMakerIntentions,
  getGptMakerTrainings,
  getIdleActions,
  getTransferRules,
  inactivateAgent,
  updateGptMakerAgent,
  updateAgentSettings,
  updateAgentWebhooks,
  updateFranchiseAssistantBlock,
  updateGptMakerIntention,
  updateGptMakerTraining,
  updateIdleAction,
  updateTransferRule,
  type FranchiseAssistantConfiguration,
  type FranchiseGptMakerConnection,
  type FranchiseSummary,
  type GptMakerIntention,
  type GptMakerTraining,
  type AgentSyncStatus,
} from "@/lib/api";
import { BookOpen, Bot, Briefcase, ChevronLeft, ChevronRight, Link2, Plus, Save, Settings, Target, Variable, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const objectiveOptions = [
  { value: "SALE", label: "Vendas", description: "Conduzir fechamento" },
  { value: "SUPPORT", label: "Suporte", description: "Resolver duvidas" },
  { value: "PERSONAL", label: "Atendimento geral", description: "Fluxo amplo da unidade" }
];

const communicationOptions = [
  { value: "FORMAL", label: "Formal", description: "Mais institucional" },
  { value: "NORMAL", label: "Normal", description: "Equilibrado" },
  { value: "RELAXED", label: "Relaxado", description: "Mais proximo e leve" }
];

const trainingTypeOptions = [
  { value: "TEXT", label: "Texto" },
  { value: "WEBSITE", label: "Website" },
  { value: "VIDEO", label: "Video" },
  { value: "DOCUMENT", label: "Documento" }
];

const intentionTypeOptions = [
  { value: "WEBHOOK", label: "Webhook" },
  { value: "INSTRUCTIONS", label: "Instrucoes" }
];

const httpMethodOptions = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "PATCH", label: "PATCH" },
  { value: "DELETE", label: "DELETE" }
];

type IntentionKeyValue = {
  name: string;
  value: string;
};

type IntentionFieldConfig = {
  name: string;
  jsonName: string;
  description: string;
  required: boolean;
};

type IntentionVariableConfig = {
  valueExpression: string;
  defaultFieldKey: string;
  customField: {
    id: string;
    name: string;
    description: string;
    jsonName: string;
  };
};

type EditableTraining = GptMakerTraining & {
  id?: string;
  type: string;
  text: string;
  image: string;
  website: string;
  trainingSubPages: string;
  trainingInterval: string;
  video: string;
  documentUrl: string;
  documentName: string;
  documentMimetype: string;
  callbackUrl: string;
};

type EditableIntention = Omit<GptMakerIntention, "headers" | "params" | "fields" | "variables"> & {
  id: string;
  name: string;
  description: string;
  instructions: string;
  details: string;
  type: string;
  httpMethod: string;
  url: string;
  headers: IntentionKeyValue[];
  params: IntentionKeyValue[];
  fields: IntentionFieldConfig[];
  variables: IntentionVariableConfig[];
  requestBody: string;
  autoGenerateParams: boolean;
  autoGenerateBody: boolean;
};

const communicationTypeValues = new Set(["FORMAL", "NORMAL", "RELAXED"]);
const objectiveTypeValues = new Set(["SUPPORT", "SALE", "PERSONAL"]);

function getBlockPayload(configuration: FranchiseAssistantConfiguration | null, blockType: string) {
  return configuration?.blocks.find((block) => block.blockType === blockType)?.payload ?? {};
}

function getImportedItems(configuration: FranchiseAssistantConfiguration | null, blockType: string) {
  const payload = getBlockPayload(configuration, blockType);
  return Array.isArray(payload.items) ? payload.items : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toBooleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function toKeyValueList(value: unknown): IntentionKeyValue[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    return {
      name: toStringValue(record.name),
      value: toStringValue(record.value)
    };
  });
}

function toIntentionFields(value: unknown): IntentionFieldConfig[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    return {
      name: toStringValue(record.name),
      jsonName: toStringValue(record.jsonName),
      description: toStringValue(record.description),
      required: toBooleanValue(record.required)
    };
  });
}

function toIntentionVariables(value: unknown): IntentionVariableConfig[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    const customField = asRecord(record.customField);
    return {
      valueExpression: toStringValue(record.valueExpression),
      defaultFieldKey: toStringValue(record.defaultFieldKey),
      customField: {
        id: toStringValue(customField.id),
        name: toStringValue(customField.name),
        description: toStringValue(customField.description),
        jsonName: toStringValue(customField.jsonName)
      }
    };
  });
}

function normalizeTrainingItem(item: unknown): EditableTraining {
  const training = asRecord(item);
  const type = toStringValue(training.type) || "TEXT";
  const content = toStringValue(training.content);
  const text = toStringValue(training.text) || content;
  return {
    id: typeof training.id === "string" ? training.id : undefined,
    type,
    title: toStringValue(training.title),
    content,
    text,
    image: toStringValue(training.image),
    website: toStringValue(training.website),
    trainingSubPages: toStringValue(training.trainingSubPages),
    trainingInterval: toStringValue(training.trainingInterval),
    video: toStringValue(training.video),
    documentUrl: toStringValue(training.documentUrl),
    documentName: toStringValue(training.documentName),
    documentMimetype: toStringValue(training.documentMimetype),
    callbackUrl: toStringValue(training.callbackUrl)
  };
}

function normalizeIntentionItem(item: unknown): EditableIntention {
  const intention = asRecord(item);
  return {
    id: toStringValue(intention.id),
    name: toStringValue(intention.name),
    description: toStringValue(intention.description) || toStringValue(intention.name),
    instructions: toStringValue(intention.instructions),
    details: toStringValue(intention.details),
    type: toStringValue(intention.type) || "INSTRUCTIONS",
    active: toBooleanValue(intention.active, true),
    httpMethod: toStringValue(intention.httpMethod),
    url: toStringValue(intention.url),
    headers: toKeyValueList(intention.headers),
    params: toKeyValueList(intention.params),
    variables: toIntentionVariables(intention.variables),
    fields: toIntentionFields(intention.fields),
    requestBody: toStringValue(intention.requestBody),
    autoGenerateParams: toBooleanValue(intention.autoGenerateParams),
    autoGenerateBody: toBooleanValue(intention.autoGenerateBody)
  };
}

function normalizeTrainings(
  remoteTrainings: unknown,
  configuration: FranchiseAssistantConfiguration | null
) {
  const source = Array.isArray(remoteTrainings) && remoteTrainings.length > 0
    ? remoteTrainings
    : getImportedItems(configuration, "TRAININGS");

  return source.map(normalizeTrainingItem);
}

function normalizeIntentions(
  remoteIntentions: unknown,
  configuration: FranchiseAssistantConfiguration | null
) {
  const source = Array.isArray(remoteIntentions) && remoteIntentions.length > 0
    ? remoteIntentions
    : getImportedItems(configuration, "INTENTIONS");

  return source.map(normalizeIntentionItem);
}

function normalizeSettings(
  remoteSettings: Record<string, unknown>,
  configuration: FranchiseAssistantConfiguration | null
) {
  if (Object.keys(remoteSettings).length > 0) {
    return remoteSettings;
  }
  const imported = getBlockPayload(configuration, "AGENT_SETTINGS");
  return imported;
}

function normalizeIdleActions(
  remoteIdleActions: unknown,
  configuration: FranchiseAssistantConfiguration | null
) {
  if (Array.isArray(remoteIdleActions) && remoteIdleActions.length > 0) {
    return remoteIdleActions as Array<Record<string, unknown>>;
  }
  const payload = getBlockPayload(configuration, "IDLE_ACTIONS");
  if (Array.isArray(payload.items)) {
    return payload.items as Array<Record<string, unknown>>;
  }
  if (Array.isArray(payload.actions)) {
    return payload.actions as Array<Record<string, unknown>>;
  }
  return [];
}

function normalizeTransferRules(
  remoteTransferRules: unknown,
  configuration: FranchiseAssistantConfiguration | null
) {
  if (Array.isArray(remoteTransferRules) && remoteTransferRules.length > 0) {
    return remoteTransferRules as Array<Record<string, unknown>>;
  }
  const payload = getBlockPayload(configuration, "TRANSFER_RULES");
  if (Array.isArray(payload.items)) {
    return payload.items as Array<Record<string, unknown>>;
  }
  return [];
}

function resolveProfileDraft(
  configuration: FranchiseAssistantConfiguration | null,
  settings: Record<string, unknown>,
  connection: FranchiseGptMakerConnection | null,
  franchise: FranchiseSummary | null
) {
  const rolePayload = configuration?.blocks.find((block) => block.blockType === "ROLE")?.payload ?? {};
  const behaviorPayload = configuration?.blocks.find((block) => block.blockType === "BEHAVIOR")?.payload ?? {};
  const communicationType = typeof rolePayload.communicationType === "string" && communicationTypeValues.has(rolePayload.communicationType)
    ? rolePayload.communicationType as "FORMAL" | "NORMAL" | "RELAXED"
    : "NORMAL";
  const objectiveType = typeof rolePayload.type === "string" && objectiveTypeValues.has(rolePayload.type)
    ? rolePayload.type as "SUPPORT" | "SALE" | "PERSONAL"
    : "SALE";
  const behavior = typeof behaviorPayload.instruction === "string" ? behaviorPayload.instruction : "";

  return {
    agentName: connection?.agentName ?? franchise?.name ?? "",
    communicationType,
    objectiveType,
    behavior,
    jobName: typeof rolePayload.jobName === "string" ? rolePayload.jobName : franchise?.name ?? "",
    jobSite: typeof rolePayload.jobSite === "string" ? rolePayload.jobSite : "",
    jobDescription: typeof rolePayload.description === "string" ? rolePayload.description : ""
  };
}

function BlockNotice({
  title,
  active,
  onCustomize,
  onRestore
}: {
  title: string;
  active: boolean;
  onCustomize: () => void;
  onRestore: () => void;
}) {
  return active ? (
    <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-700 dark:text-brand-300">{title} usando padrao da matriz</p>
          <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">Clique em customizar para assumir este bloco na unidade.</p>
        </div>
        <button type="button" onClick={onCustomize} className="text-sm font-medium text-brand-600 dark:text-brand-400">
          Customizar
        </button>
      </div>
    </div>
  ) : (
    <div className="flex justify-end">
      <button type="button" onClick={onRestore} className="btn-secondary text-sm">
        Voltar ao padrao
      </button>
    </div>
  );
}

function KeyValueEditor({
  title,
  description,
  items,
  addLabel,
  onAdd,
  onChange,
  onRemove
}: {
  title: string;
  description: string;
  items: IntentionKeyValue[];
  addLabel: string;
  onAdd: () => void;
  onChange: (index: number, key: "name" | "value", value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{title}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>{description}</p>
        </div>
        <button type="button" onClick={onAdd} className="btn-secondary text-sm">
          <Plus size={14} />
          {addLabel}
        </button>
      </div>

      {items.length ? items.map((item, index) => (
        <div key={`${title}-${index}`} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_1fr_auto]" style={{ borderColor: "var(--color-border)" }}>
          <Field label="Nome" value={item.name} onChange={(value) => onChange(index, "name", value)} />
          <Field label="Valor" value={item.value} onChange={(value) => onChange(index, "value", value)} />
          <button type="button" onClick={() => onRemove(index)} className="text-sm text-red-500 md:self-end">
            Remover
          </button>
        </div>
      )) : (
        <div className="rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-tertiary)" }}>
          Nenhum item configurado.
        </div>
      )}
    </div>
  );
}

function IntentionFieldsEditor({
  fields,
  onAdd,
  onChange,
  onRemove
}: {
  fields: IntentionFieldConfig[];
  onAdd: () => void;
  onChange: (index: number, key: keyof IntentionFieldConfig, value: string | boolean) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Campos retornados</p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>Defina os campos que a intenção expõe para o agente usar.</p>
        </div>
        <button type="button" onClick={onAdd} className="btn-secondary text-sm">
          <Plus size={14} />
          Adicionar campo
        </button>
      </div>

      {fields.length ? fields.map((field, index) => (
        <div key={`field-${index}`} className="grid gap-3 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome" value={field.name} onChange={(value) => onChange(index, "name", value)} />
            <Field label="jsonName" value={field.jsonName} onChange={(value) => onChange(index, "jsonName", value)} />
          </div>
          <RichTextarea label="Descricao" value={field.description} onChange={(value) => onChange(index, "description", value)} rows={2} />
          <div className="flex items-center justify-between gap-3">
            <ToggleField label="Obrigatorio" checked={field.required} onChange={(checked) => onChange(index, "required", checked)} />
            <button type="button" onClick={() => onRemove(index)} className="text-sm text-red-500">
              Remover
            </button>
          </div>
        </div>
      )) : (
        <div className="rounded-xl border border-dashed p-5 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-tertiary)" }}>
          Nenhum campo configurado.
        </div>
      )}
    </div>
  );
}

function IntentionVariablesEditor({
  variables,
  onAdd,
  onChange,
  onRemove
}: {
  variables: IntentionVariableConfig[];
  onAdd: () => void;
  onChange: (
    index: number,
    key: "valueExpression" | "defaultFieldKey" | "customField.id" | "customField.name" | "customField.jsonName" | "customField.description",
    value: string
  ) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Variaveis</p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>Mapeie as variáveis que alimentam a chamada e os campos customizados.</p>
        </div>
        <button type="button" onClick={onAdd} className="btn-secondary text-sm">
          <Plus size={14} />
          Adicionar variavel
        </button>
      </div>

      {variables.length ? variables.map((variable, index) => (
        <div key={`variable-${index}`} className="grid gap-3 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="valueExpression" value={variable.valueExpression} onChange={(value) => onChange(index, "valueExpression", value)} />
            <Field label="defaultFieldKey" value={variable.defaultFieldKey} onChange={(value) => onChange(index, "defaultFieldKey", value)} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="customField.id" value={variable.customField.id} onChange={(value) => onChange(index, "customField.id", value)} />
            <Field label="customField.name" value={variable.customField.name} onChange={(value) => onChange(index, "customField.name", value)} />
            <Field label="customField.jsonName" value={variable.customField.jsonName} onChange={(value) => onChange(index, "customField.jsonName", value)} />
            <Field label="customField.description" value={variable.customField.description} onChange={(value) => onChange(index, "customField.description", value)} />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => onRemove(index)} className="text-sm text-red-500">
              Remover
            </button>
          </div>
        </div>
      )) : (
        <div className="rounded-xl border border-dashed p-5 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-tertiary)" }}>
          Nenhuma variavel configurada.
        </div>
      )}
    </div>
  );
}

function IntentionEditModal({
  isOpen,
  draft,
  step,
  isSaving,
  onStepChange,
  onChange,
  onClose,
  onSave
}: {
  isOpen: boolean;
  draft: EditableIntention | null;
  step: number;
  isSaving: boolean;
  onStepChange: (step: number) => void;
  onChange: (updater: (current: EditableIntention) => EditableIntention) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen && !isSaving) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !draft) {
    return null;
  }

  const steps = [
    {
      id: "endpoint",
      title: "Endpoint",
      description: draft.url || "Defina URL, metodo, headers e parametros.",
      icon: <Link2 size={16} />
    },
    {
      id: "fields",
      title: "Campos",
      description: `${draft.fields.length} campo${draft.fields.length === 1 ? "" : "s"} configurado${draft.fields.length === 1 ? "" : "s"}.`,
      icon: <Target size={16} />
    },
    {
      id: "variables",
      title: "Variaveis",
      description: `${draft.variables.length} variavel${draft.variables.length === 1 ? "" : "is"} configurada${draft.variables.length === 1 ? "" : "s"}.`,
      icon: <Variable size={16} />
    }
  ];

  const endpointStep = (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome interno" value={draft.name} onChange={(value) => onChange((current) => ({ ...current, name: value }))} />
          <Field label="Descricao" value={draft.description} onChange={(value) => onChange((current) => ({ ...current, description: value }))} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Tipo"
            value={draft.type}
            onChange={(value) => onChange((current) => ({ ...current, type: value }))}
            options={intentionTypeOptions.some((option) => option.value === draft.type) ? intentionTypeOptions : [...intentionTypeOptions, { value: draft.type, label: draft.type }]}
          />
          <SelectField
            label="Metodo HTTP"
            value={draft.httpMethod || "POST"}
            onChange={(value) => onChange((current) => ({ ...current, httpMethod: value }))}
            options={httpMethodOptions.some((option) => option.value === draft.httpMethod) || !draft.httpMethod
              ? httpMethodOptions
              : [...httpMethodOptions, { value: draft.httpMethod, label: draft.httpMethod }]}
          />
        </div>
        <Field label="URL do webhook" value={draft.url} onChange={(value) => onChange((current) => ({ ...current, url: value }))} />
        <RichTextarea label="Quando usar" value={draft.instructions} onChange={(value) => onChange((current) => ({ ...current, instructions: value }))} rows={4} />
        <RichTextarea label="Detalhes de saida" value={draft.details} onChange={(value) => onChange((current) => ({ ...current, details: value }))} rows={3} />
      </div>

      <KeyValueEditor
        title="Headers"
        description="Envie cabeçalhos fixos ou credenciais exigidas pelo endpoint."
        items={draft.headers}
        addLabel="Adicionar header"
        onAdd={() => onChange((current) => ({ ...current, headers: [...current.headers, { name: "", value: "" }] }))}
        onChange={(index, key, value) => onChange((current) => ({
          ...current,
          headers: current.headers.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
        }))}
        onRemove={(index) => onChange((current) => ({ ...current, headers: current.headers.filter((_, itemIndex) => itemIndex !== index) }))}
      />

      <KeyValueEditor
        title="Parametros"
        description="Defina query params ou parâmetros fixos usados na chamada."
        items={draft.params}
        addLabel="Adicionar parametro"
        onAdd={() => onChange((current) => ({ ...current, params: [...current.params, { name: "", value: "" }] }))}
        onChange={(index, key, value) => onChange((current) => ({
          ...current,
          params: current.params.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
        }))}
        onRemove={(index) => onChange((current) => ({ ...current, params: current.params.filter((_, itemIndex) => itemIndex !== index) }))}
      />

      <div className="grid gap-4 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
        <RichTextarea label="Request body" value={draft.requestBody} onChange={(value) => onChange((current) => ({ ...current, requestBody: value }))} rows={6} />
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleField label="Gerar params automaticamente" checked={draft.autoGenerateParams} onChange={(checked) => onChange((current) => ({ ...current, autoGenerateParams: checked }))} />
          <ToggleField label="Gerar body automaticamente" checked={draft.autoGenerateBody} onChange={(checked) => onChange((current) => ({ ...current, autoGenerateBody: checked }))} />
        </div>
      </div>
    </div>
  );

  const fieldsStep = (
    <IntentionFieldsEditor
      fields={draft.fields}
      onAdd={() => onChange((current) => ({
        ...current,
        fields: [...current.fields, { name: "", jsonName: "", description: "", required: false }]
      }))}
      onChange={(index, key, value) => onChange((current) => ({
        ...current,
        fields: current.fields.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
      }))}
      onRemove={(index) => onChange((current) => ({
        ...current,
        fields: current.fields.filter((_, itemIndex) => itemIndex !== index)
      }))}
    />
  );

  const variablesStep = (
    <IntentionVariablesEditor
      variables={draft.variables}
      onAdd={() => onChange((current) => ({
        ...current,
        variables: [...current.variables, { valueExpression: "", defaultFieldKey: "", customField: { id: "", name: "", description: "", jsonName: "" } }]
      }))}
      onChange={(index, key, value) => onChange((current) => ({
        ...current,
        variables: current.variables.map((item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }
          if (key.startsWith("customField.")) {
            const customFieldKey = key.replace("customField.", "") as keyof IntentionVariableConfig["customField"];
            return { ...item, customField: { ...item.customField, [customFieldKey]: value } };
          }
          return { ...item, [key]: value };
        })
      }))}
      onRemove={(index) => onChange((current) => ({
        ...current,
        variables: current.variables.filter((_, itemIndex) => itemIndex !== index)
      }))}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
      <div className="card relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden shadow-soft-lg animate-scale-in">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em]" style={{ color: "var(--color-text-tertiary)" }}>Editar intencao</p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {draft.description || draft.name || "Intencao"}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Fluxo em etapas para revisar endpoint, campos e variaveis sem poluir a listagem.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-md p-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5" aria-label="Fechar edicao da intencao">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3 border-b px-6 py-4 md:grid-cols-3" style={{ borderColor: "var(--color-border)" }}>
          {steps.map((item, index) => {
            const active = index === step;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onStepChange(index)}
                className="grid min-h-[88px] gap-2 rounded-lg border px-4 py-3 text-left transition"
                style={{
                  borderColor: active ? "rgb(14 165 233 / 0.45)" : "var(--color-border)",
                  background: active ? "var(--color-bg-secondary)" : "var(--color-bg-primary)"
                }}
              >
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {item.icon}
                  <span>{`Passo ${index + 1}`}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
                  <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-text-tertiary)" }}>{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {step === 0 ? endpointStep : step === 1 ? fieldsStep : variablesStep}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4" style={{ borderColor: "var(--color-border)" }}>
          <button type="button" onClick={() => onStepChange(Math.max(0, step - 1))} disabled={step === 0 || isSaving} className="btn-secondary text-sm">
            <ChevronLeft size={16} />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="btn-secondary text-sm">
              Cancelar
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => onStepChange(step + 1)} disabled={isSaving} className="btn-primary text-sm">
                Proximo
                <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={onSave} disabled={isSaving || !draft.description.trim()} className="btn-primary text-sm min-w-[160px]">
                {isSaving ? "Salvando..." : "Salvar intencao"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentConfigPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { error: showError, success: showSuccess } = useToast();
  const [franchise, setFranchise] = useState<FranchiseSummary | null>(null);
  const [connection, setConnection] = useState<FranchiseGptMakerConnection | null>(null);
  const [configuration, setConfiguration] = useState<FranchiseAssistantConfiguration | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [trainings, setTrainings] = useState<EditableTraining[]>([]);
  const [intentions, setIntentions] = useState<EditableIntention[]>([]);
  const [idleActions, setIdleActions] = useState<Array<Record<string, unknown>>>([]);
  const [webhooks, setWebhooks] = useState<Record<string, unknown>>({});
  const [transferRules, setTransferRules] = useState<Array<Record<string, unknown>>>([]);
  const [syncStatus, setSyncStatus] = useState<AgentSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const [agentName, setAgentName] = useState("");
  const [communicationType, setCommunicationType] = useState<"FORMAL" | "NORMAL" | "RELAXED">("NORMAL");
  const [objectiveType, setObjectiveType] = useState<"SUPPORT" | "SALE" | "PERSONAL">("SALE");
  const [behavior, setBehavior] = useState("");
  const [jobName, setJobName] = useState("");
  const [jobSite, setJobSite] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [newTrainingTitle, setNewTrainingTitle] = useState("");
  const [newTrainingContent, setNewTrainingContent] = useState("");
  const [newIntentionName, setNewIntentionName] = useState("");
  const [newIntentionDescription, setNewIntentionDescription] = useState("");
  const [newIntentionInstructions, setNewIntentionInstructions] = useState("");
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [trainingDraft, setTrainingDraft] = useState<EditableTraining | null>(null);
  const [editingIntentionId, setEditingIntentionId] = useState<string | null>(null);
  const [intentionDraft, setIntentionDraft] = useState<EditableIntention | null>(null);
  const [intentionEditStep, setIntentionEditStep] = useState(0);

  const applyProfileDraft = useCallback((
    nextConfiguration: FranchiseAssistantConfiguration | null,
    nextSettings: Record<string, unknown>,
    nextConnection: FranchiseGptMakerConnection | null,
    nextFranchise: FranchiseSummary | null
  ) => {
    const draft = resolveProfileDraft(nextConfiguration, nextSettings, nextConnection, nextFranchise);
    setAgentName(draft.agentName);
    setCommunicationType(draft.communicationType);
    setObjectiveType(draft.objectiveType);
    setBehavior(draft.behavior);
    setJobName(draft.jobName);
    setJobSite(draft.jobSite);
    setJobDescription(draft.jobDescription);
  }, []);

  useEffect(() => {
    if (!params?.id) {
      return;
    }
    setIsLoading(true);
    Promise.all([
      getFranchiseById(params.id),
      getFranchiseGptMakerConnection(params.id),
      getFranchiseAssistantConfiguration(params.id),
      getAgentSettings(params.id).catch(() => ({})),
      getGptMakerIntentions(params.id).catch(() => []),
      getGptMakerTrainings(params.id).catch(() => []),
      getIdleActions(params.id).catch(() => ({ actions: [] })),
      getAgentWebhooks(params.id).catch(() => ({})),
      getTransferRules(params.id).catch(() => []),
    ])
      .then(([franchiseData, connectionData, configurationData, settingsData, intentionsData, trainingsData, idleActionsData, webhooksData, transferRulesData]) => {
        const normalizedSettings = normalizeSettings(settingsData as Record<string, unknown>, configurationData);
        const normalizedIntentions = normalizeIntentions(intentionsData, configurationData);
        const normalizedTrainings = normalizeTrainings(trainingsData, configurationData);
        const normalizedIdleActions = normalizeIdleActions(idleActionsData, configurationData);
        const normalizedTransferRules = normalizeTransferRules(transferRulesData, configurationData);
        setFranchise(franchiseData);
        setConnection(connectionData);
        setConfiguration(configurationData);
        setSettings(normalizedSettings);
        setIntentions(normalizedIntentions);
        setTrainings(normalizedTrainings);
        setIdleActions(normalizedIdleActions);
        setWebhooks(webhooksData as Record<string, unknown>);
        setTransferRules(normalizedTransferRules);
        setSyncStatus({
          status: connectionData.status || franchiseData.status || "ATIVA",
          agentId: connectionData.agentId ?? null,
          agentName: connectionData.agentName ?? null,
          syncedAt: connectionData.lastSyncAt ?? undefined,
        });
        applyProfileDraft(configurationData, normalizedSettings, connectionData, franchiseData);
      })
      .catch((requestError) => showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar configuracao do assistente."))
      .finally(() => setIsLoading(false));
  }, [applyProfileDraft, params?.id, showError]);

  const hasAgent = Boolean(connection?.agentId);
  const agentStatus = syncStatus?.status || connection?.status || franchise?.status || "ATIVA";
  const behaviorBlock = useMemo(() => configuration?.blocks.find((block) => block.blockType === "BEHAVIOR"), [configuration]);
  const trainingsBlock = useMemo(() => configuration?.blocks.find((block) => block.blockType === "TRAININGS"), [configuration]);
  const intentionsBlock = useMemo(() => configuration?.blocks.find((block) => block.blockType === "INTENTIONS"), [configuration]);
  const useStandardPersonality = behaviorBlock?.mode === "STANDARD";
  const useStandardTrainings = trainingsBlock?.mode === "STANDARD";
  const useStandardIntentions = intentionsBlock?.mode === "STANDARD";

  const refreshBlockMode = useCallback(async (
    blockType: "BEHAVIOR" | "TRAININGS" | "INTENTIONS",
    mode: "STANDARD" | "CUSTOM"
  ) => {
    if (!params?.id) {
      return;
    }
    const next = mode === "CUSTOM"
      ? await customizeFranchiseAssistantBlock(params.id, blockType)
      : await updateFranchiseAssistantBlock(params.id, blockType, "STANDARD");
    setConfiguration(next);
    if (blockType === "BEHAVIOR") {
      applyProfileDraft(next, settings, connection, franchise);
    }
    showSuccess(mode === "CUSTOM" ? "Bloco customizado para a unidade." : "Bloco voltou para o padrao da matriz.");
  }, [applyProfileDraft, connection, franchise, params?.id, settings, showSuccess]);

  const handleSaveProfile = useCallback(async () => {
    if (!params?.id) {
      return;
    }
    setIsSaving(true);
    try {
      const profileDraft = useStandardPersonality
        ? resolveProfileDraft(configuration, settings, connection, franchise)
        : {
            agentName,
            communicationType,
            behavior
          };

      await updateGptMakerAgent(params.id, {
        name: profileDraft.agentName,
        communicationType: profileDraft.communicationType,
        behavior: profileDraft.behavior
      });

      setConnection((prev) => prev ? { ...prev, agentName: profileDraft.agentName } : null);
      if (useStandardPersonality) {
        applyProfileDraft(configuration, settings, connection, franchise);
      }
      showSuccess("Perfil do assistente salvo com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar o perfil.");
    } finally {
      setIsSaving(false);
    }
  }, [
    agentName,
    applyProfileDraft,
    behavior,
    communicationType,
    configuration,
    connection,
    franchise,
    objectiveType,
    params?.id,
    settings,
    showError,
    showSuccess,
    useStandardPersonality
  ]);

  const handleSaveWork = useCallback(async () => {
    if (!params?.id) {
      return;
    }
    setIsSaving(true);
    try {
      await updateGptMakerAgent(params.id, {
        type: objectiveType,
        jobName: jobName.trim() || franchise?.name || "Assistente Vavive",
        jobSite: jobSite.trim(),
        jobDescription: jobDescription.trim()
      });
      showSuccess("Dados de trabalho salvos com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar os dados de trabalho.");
    } finally {
      setIsSaving(false);
    }
  }, [franchise?.name, jobDescription, jobName, jobSite, objectiveType, params?.id, showError, showSuccess]);

  const productNameLabel = jobName.trim() || "o produto";

  const handleSaveSettings = useCallback(async () => {
    if (!params?.id) {
      return;
    }
    setIsSaving(true);
    try {
      await updateAgentSettings(params.id, settings);
      showSuccess("Configuracoes tecnicas salvas.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar configuracoes.");
    } finally {
      setIsSaving(false);
    }
  }, [params?.id, settings, showError, showSuccess]);

  const handleAddTraining = useCallback(async () => {
    if (!params?.id || !newTrainingContent.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      const created = await createGptMakerTraining(params.id, {
        type: "TEXT",
        text: newTrainingContent
      });
      const createdRecord = created as Record<string, unknown>;
      setTrainings((current) => [...current, normalizeTrainingItem({
        ...createdRecord,
        title: newTrainingTitle,
        text: newTrainingContent,
        content: newTrainingContent,
        type: createdRecord.type ?? "TEXT"
      })]);
      setNewTrainingTitle("");
      setNewTrainingContent("");
      showSuccess("Treinamento criado com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar treinamento.");
    } finally {
      setIsSaving(false);
    }
  }, [newTrainingContent, newTrainingTitle, params?.id, showError, showSuccess]);

  const buildTrainingPayload = useCallback((training: EditableTraining) => {
    const payload: Record<string, unknown> = {
      id: training.id,
      type: training.type || "TEXT",
      callbackUrl: training.callbackUrl.trim() || undefined
    };

    if (training.type === "WEBSITE") {
      payload.website = training.website.trim();
      payload.trainingSubPages = training.trainingSubPages.trim() || undefined;
      payload.trainingInterval = training.trainingInterval.trim() || undefined;
    } else if (training.type === "VIDEO") {
      payload.video = training.video.trim();
    } else if (training.type === "DOCUMENT") {
      payload.documentUrl = training.documentUrl.trim();
      payload.documentName = training.documentName.trim() || undefined;
      payload.documentMimetype = training.documentMimetype.trim() || undefined;
    } else {
      payload.text = training.text.trim();
      payload.image = training.image.trim() || undefined;
    }

    return payload;
  }, []);

  const startTrainingEdit = useCallback((training: EditableTraining) => {
    setEditingTrainingId(training.id ?? null);
    setTrainingDraft({ ...training });
  }, []);

  const cancelTrainingEdit = useCallback(() => {
    setEditingTrainingId(null);
    setTrainingDraft(null);
  }, []);

  const saveTrainingEdit = useCallback(async () => {
    if (!params?.id || !editingTrainingId || !trainingDraft) {
      return;
    }
    setIsSaving(true);
    try {
      const payload = buildTrainingPayload(trainingDraft);
      await updateGptMakerTraining(params.id, editingTrainingId, payload);
      setTrainings((current) => current.map((item) => item.id === editingTrainingId ? { ...trainingDraft } : item));
      cancelTrainingEdit();
      showSuccess("Treinamento atualizado com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel atualizar o treinamento.");
    } finally {
      setIsSaving(false);
    }
  }, [buildTrainingPayload, cancelTrainingEdit, editingTrainingId, params?.id, showError, showSuccess, trainingDraft]);

  const handleAddIntention = useCallback(async () => {
    if (!params?.id || !newIntentionName.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      const created = await createGptMakerIntention(params.id, {
        name: newIntentionName,
        description: newIntentionDescription,
        instructions: newIntentionInstructions
      });
      setIntentions((current) => [...current, normalizeIntentionItem({
        ...created,
        name: newIntentionName,
        description: newIntentionDescription || newIntentionName,
        instructions: newIntentionInstructions
      })]);
      setNewIntentionName("");
      setNewIntentionDescription("");
      setNewIntentionInstructions("");
      showSuccess("Intencao criada com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar intencao.");
    } finally {
      setIsSaving(false);
    }
  }, [newIntentionDescription, newIntentionInstructions, newIntentionName, params?.id, showError, showSuccess]);

  const buildIntentionPayload = useCallback((intention: EditableIntention) => {
    const compactKeyValues = (items: IntentionKeyValue[]) => items
      .filter((item) => item.name.trim() || item.value.trim())
      .map((item) => ({ name: item.name.trim(), value: item.value.trim() }));

    const compactFields = intention.fields
      .filter((field) => field.name.trim() || field.jsonName.trim() || field.description.trim())
      .map((field) => ({
        name: field.name.trim(),
        jsonName: field.jsonName.trim(),
        description: field.description.trim(),
        required: field.required
      }));

    const compactVariables = intention.variables
      .filter((variable) =>
        variable.valueExpression.trim()
        || variable.defaultFieldKey.trim()
        || variable.customField.id.trim()
        || variable.customField.name.trim()
        || variable.customField.description.trim()
        || variable.customField.jsonName.trim()
      )
      .map((variable) => ({
        valueExpression: variable.valueExpression.trim(),
        defaultFieldKey: variable.defaultFieldKey.trim() || undefined,
        customField: {
          id: variable.customField.id.trim() || undefined,
          name: variable.customField.name.trim() || undefined,
          description: variable.customField.description.trim() || undefined,
          jsonName: variable.customField.jsonName.trim() || undefined
        }
      }));

    return {
      id: intention.id,
      name: intention.name.trim() || undefined,
      description: intention.description.trim(),
      instructions: intention.instructions.trim(),
      details: intention.details.trim() || undefined,
      fields: compactFields,
      type: intention.type.trim(),
      httpMethod: intention.httpMethod.trim() || undefined,
      url: intention.url.trim() || undefined,
      headers: compactKeyValues(intention.headers),
      params: compactKeyValues(intention.params),
      variables: compactVariables,
      requestBody: intention.requestBody.trim() || undefined,
      autoGenerateParams: intention.autoGenerateParams,
      autoGenerateBody: intention.autoGenerateBody
    };
  }, []);

  const startIntentionEdit = useCallback((intention: EditableIntention) => {
    setEditingIntentionId(intention.id);
    setIntentionEditStep(0);
    setIntentionDraft({
      ...intention,
      headers: intention.headers.map((item) => ({ ...item })),
      params: intention.params.map((item) => ({ ...item })),
      fields: intention.fields.map((item) => ({ ...item })),
      variables: intention.variables.map((item) => ({
        ...item,
        customField: { ...item.customField }
      }))
    });
  }, []);

  const cancelIntentionEdit = useCallback(() => {
    setEditingIntentionId(null);
    setIntentionDraft(null);
    setIntentionEditStep(0);
  }, []);

  const saveIntentionEdit = useCallback(async () => {
    if (!params?.id || !editingIntentionId || !intentionDraft) {
      return;
    }
    setIsSaving(true);
    try {
      const payload = buildIntentionPayload(intentionDraft);
      await updateGptMakerIntention(params.id, editingIntentionId, payload);
      setIntentions((current) => current.map((item) => item.id === editingIntentionId ? { ...intentionDraft } : item));
      cancelIntentionEdit();
      showSuccess("Intencao atualizada com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel atualizar a intencao.");
    } finally {
      setIsSaving(false);
    }
  }, [buildIntentionPayload, cancelIntentionEdit, editingIntentionId, intentionDraft, params?.id, showError, showSuccess]);

  const tabs: TabItem[] = [
    {
      id: "profile",
      label: "Perfil",
      icon: <Bot size={16} />,
      content: (
        <div className="space-y-6">
          <Field label="Nome do assistente" value={agentName} onChange={setAgentName} required />
          <OptionCards
            label="Comunicacao"
            description="Como o assistente se comunica"
            value={communicationType}
            onChange={(value) => setCommunicationType(value as typeof communicationType)}
            options={communicationOptions}
          />
          <RichTextarea
            label="Comportamento"
            placeholder="Descreva como o agente deve se comportar durante a conversa..."
            value={behavior}
            onChange={setBehavior}
            rows={5}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Status do agente</p>
            <StatusDropdown
              currentStatus={agentStatus}
              onChange={async (newStatus) => {
                if (!params?.id) return;
                setIsSaving(true);
                            try {
                              let nextStatus = newStatus;
                              if (newStatus === "ATIVA") {
                                await activateAgent(params.id);
                              } else if (newStatus === "INATIVA") {
                                await inactivateAgent(params.id);
                              }
                              // TRAINING is intentionally disabled for now. GPTMaker rejects this update with the current token/API contract.
                              setSyncStatus((prev) => ({
                                status: nextStatus,
                                agentId: prev?.agentId ?? connection?.agentId ?? null,
                                agentName: prev?.agentName ?? connection?.agentName ?? null,
                                syncedAt: new Date().toISOString(),
                              }));
                              showSuccess(`Status alterado para ${newStatus === "ATIVA" ? "Ativo" : newStatus === "TRAINING" ? "Treinamento" : "Desativado"}.`);
                            } catch (e) {
                              showError(e instanceof Error ? e.message : "Nao foi possivel alterar o status do agente.");
                            } finally {
                              setIsSaving(false);
                            }
                          }}
              disabled={isSaving}
            />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={handleSaveProfile} disabled={isSaving} className="btn-primary">
              <Save size={16} />
              {isSaving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </div>
      )
    },
    {
      id: "work",
      label: "Trabalho",
      icon: <Briefcase size={16} />,
      content: (
        <div className="space-y-6">
          <OptionCards
            label="Finalidade"
            value={objectiveType}
            onChange={(value) => setObjectiveType(value as typeof objectiveType)}
            options={objectiveOptions}
          />
          <Field label="Vende o produto" value={jobName} onChange={setJobName} />
          <Field label="Site oficial (opcional)" value={jobSite} onChange={setJobSite} />
          <RichTextarea
            label={`Descreve um pouco sobre ${productNameLabel}`}
            value={jobDescription}
            onChange={setJobDescription}
            rows={5}
          />
          <div className="flex justify-end">
            <button type="button" onClick={handleSaveWork} disabled={isSaving} className="btn-primary">
              <Save size={16} />
              {isSaving ? "Salvando..." : "Salvar trabalho"}
            </button>
          </div>
        </div>
      )
    },
    {
      id: "trainings",
      label: "Treinamentos",
      icon: <BookOpen size={16} />,
      badge: String(trainings.length),
      content: (
        <div className="space-y-6">
          <BlockNotice
            title="Treinamentos"
            active={Boolean(useStandardTrainings)}
            onCustomize={() => void refreshBlockMode("TRAININGS", "CUSTOM")}
            onRestore={() => void refreshBlockMode("TRAININGS", "STANDARD")}
          />
          {trainings.length ? (
            <div className="space-y-3">
              {trainings.map((training, index) => (
                <div key={training.id ?? index} className="card p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {training.title || training.type || `Treinamento ${index + 1}`}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-tertiary)" }}>
                        {training.type || "TEXT"}
                      </p>
                      <p className="mt-2 text-sm line-clamp-3 whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
                        {training.text || training.content || training.website || training.video || training.documentUrl || "Sem conteudo."}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {training.id ? (
                        <button
                          type="button"
                          onClick={() => startTrainingEdit(training)}
                          disabled={Boolean(useStandardTrainings)}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-60"
                        >
                          Editar
                        </button>
                      ) : null}
                      {training.id && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!params?.id || !training.id) return;
                            try {
                              await deleteGptMakerTraining(params.id, training.id);
                              setTrainings((current) => current.filter((t) => t.id !== training.id));
                              if (editingTrainingId === training.id) {
                                cancelTrainingEdit();
                              }
                              showSuccess("Treinamento removido.");
                            } catch (err) {
                              showError(err instanceof Error ? err.message : "Erro ao remover treinamento.");
                            }
                          }}
                          disabled={Boolean(useStandardTrainings)}
                          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-60"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>

                  {editingTrainingId === training.id && trainingDraft ? (
                    <div className="grid gap-4 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
                      <SelectField
                        label="Tipo do treinamento"
                        value={trainingDraft.type}
                        onChange={(value) => setTrainingDraft((current) => current ? { ...current, type: value } : current)}
                        options={trainingTypeOptions}
                        disabled={isSaving}
                      />
                      {trainingDraft.type === "WEBSITE" ? (
                        <>
                          <Field label="URL do website" value={trainingDraft.website} onChange={(value) => setTrainingDraft((current) => current ? { ...current, website: value } : current)} />
                          <Field label="Subpaginas" value={trainingDraft.trainingSubPages} onChange={(value) => setTrainingDraft((current) => current ? { ...current, trainingSubPages: value } : current)} hint="Ex.: true, false ou regra usada pela operacao." />
                          <Field label="Intervalo de treino" value={trainingDraft.trainingInterval} onChange={(value) => setTrainingDraft((current) => current ? { ...current, trainingInterval: value } : current)} />
                        </>
                      ) : trainingDraft.type === "VIDEO" ? (
                        <Field label="URL do video" value={trainingDraft.video} onChange={(value) => setTrainingDraft((current) => current ? { ...current, video: value } : current)} />
                      ) : trainingDraft.type === "DOCUMENT" ? (
                        <>
                          <Field label="URL do documento" value={trainingDraft.documentUrl} onChange={(value) => setTrainingDraft((current) => current ? { ...current, documentUrl: value } : current)} />
                          <Field label="Nome do documento" value={trainingDraft.documentName} onChange={(value) => setTrainingDraft((current) => current ? { ...current, documentName: value } : current)} />
                          <Field label="Mimetype" value={trainingDraft.documentMimetype} onChange={(value) => setTrainingDraft((current) => current ? { ...current, documentMimetype: value } : current)} />
                        </>
                      ) : (
                        <>
                          <Field label="Imagem (opcional)" value={trainingDraft.image} onChange={(value) => setTrainingDraft((current) => current ? { ...current, image: value } : current)} />
                          <RichTextarea label="Texto do treinamento" value={trainingDraft.text} onChange={(value) => setTrainingDraft((current) => current ? { ...current, text: value, content: value } : current)} rows={5} />
                        </>
                      )}
                      <Field label="Callback URL (opcional)" value={trainingDraft.callbackUrl} onChange={(value) => setTrainingDraft((current) => current ? { ...current, callbackUrl: value } : current)} />
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={cancelTrainingEdit} disabled={isSaving} className="btn-secondary text-sm">
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={saveTrainingEdit}
                          disabled={isSaving}
                          className="btn-primary text-sm"
                        >
                          {isSaving ? "Salvando..." : "Salvar treinamento"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhum treinamento cadastrado.</p>
          )}
          <div className="card p-4 space-y-4">
            <Field label="Titulo (opcional)" value={newTrainingTitle} onChange={setNewTrainingTitle} placeholder="Ex: Servicos da unidade" disabled={Boolean(useStandardTrainings)} />
            <RichTextarea label="Conteudo" value={newTrainingContent} onChange={setNewTrainingContent} rows={4} placeholder="Conteudo do treinamento" disabled={Boolean(useStandardTrainings)} />
            <button type="button" onClick={handleAddTraining} disabled={Boolean(useStandardTrainings) || !newTrainingContent.trim() || isSaving} className="btn-secondary text-sm">
              {isSaving ? "Salvando..." : "Adicionar treinamento"}
            </button>
          </div>
        </div>
      )
    },
    {
      id: "intentions",
      label: "Intencoes",
      icon: <Target size={16} />,
      badge: String(intentions.length),
      content: (
        <div className="space-y-6">
          <BlockNotice
            title="Intencoes"
            active={Boolean(useStandardIntentions)}
            onCustomize={() => void refreshBlockMode("INTENTIONS", "CUSTOM")}
            onRestore={() => void refreshBlockMode("INTENTIONS", "STANDARD")}
          />
          {intentions.length ? (
            <div className="space-y-3">
              {intentions.map((intention) => (
                <div key={intention.id} className="card p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {intention.description || intention.name || "Intencao"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                        <span className="rounded-full px-2 py-1" style={{ background: "var(--color-bg-secondary)" }}>{intention.type || "INSTRUCTIONS"}</span>
                        {intention.httpMethod ? <span>{intention.httpMethod}</span> : null}
                        {intention.url ? <span className="truncate">{intention.url}</span> : null}
                      </div>
                      {intention.instructions ? <p className="mt-2 text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>{intention.instructions}</p> : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startIntentionEdit(intention)}
                        disabled={Boolean(useStandardIntentions)}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-60"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!params?.id) return;
                          try {
                            await deleteGptMakerIntention(params.id, intention.id);
                            setIntentions((current) => current.filter((i) => i.id !== intention.id));
                            if (editingIntentionId === intention.id) {
                              cancelIntentionEdit();
                            }
                            showSuccess("Intencao removida.");
                          } catch (err) {
                            showError(err instanceof Error ? err.message : "Erro ao remover intencao.");
                          }
                        }}
                        disabled={Boolean(useStandardIntentions)}
                        className="text-sm text-red-500 hover:text-red-700 disabled:opacity-60"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Nenhuma intencao cadastrada.</p>
          )}
          <div className="card p-4 space-y-4">
            <Field label="Nome" value={newIntentionName} onChange={setNewIntentionName} disabled={Boolean(useStandardIntentions)} />
            <Field label="Descricao" value={newIntentionDescription} onChange={setNewIntentionDescription} disabled={Boolean(useStandardIntentions)} />
            <RichTextarea label="Instrucoes" value={newIntentionInstructions} onChange={setNewIntentionInstructions} rows={3} disabled={Boolean(useStandardIntentions)} />
            <button type="button" onClick={handleAddIntention} disabled={Boolean(useStandardIntentions) || !newIntentionName.trim() || isSaving} className="btn-primary text-sm">
              <Plus size={14} />
              Adicionar intencao
            </button>
          </div>
        </div>
      )
    },
    {
      id: "settings",
      label: "Configuracoes",
      icon: <Settings size={16} />,
      content: (
        <div className="space-y-6">
          <TabConfig
            tabs={[
              {
                id: "conversation",
                label: "Conversa",
                content: (
                  <ConversationSettings
                    settings={settings}
                    onSave={async (newSettings) => {
                      if (!params?.id) return;
                      setIsSaving(true);
                      try {
                        await updateAgentSettings(params.id, newSettings);
                        setSettings(newSettings);
                        showSuccess("Configuracoes salvas.");
                      } catch (err) {
                        showError(err instanceof Error ? err.message : "Erro ao salvar configuracoes.");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    isSaving={isSaving}
                  />
                )
              },
              {
                id: "idle-actions",
                label: "Acoes de Inatividade",
                badge: String(idleActions.length),
                content: (
                  <IdleActionsSettings
                    actions={idleActions}
                    onCreate={async (payload) => {
                      if (!params?.id) return;
                      const result = await createIdleAction(params.id, payload);
                      setIdleActions((prev) => [...prev, result as Record<string, unknown>]);
                      showSuccess("Acao criada.");
                    }}
                    onUpdate={async (actionId, payload) => {
                      if (!params?.id) return;
                      await updateIdleAction(params.id, actionId, payload);
                      setIdleActions((prev) => prev.map((a) => a.id === actionId ? { ...a, ...payload } : a));
                      showSuccess("Acao atualizada.");
                    }}
                    onDelete={async (actionId) => {
                      if (!params?.id) return;
                      await deleteIdleAction(params.id, actionId);
                      setIdleActions((prev) => prev.filter((a) => a.id !== actionId));
                      showSuccess("Acao removida.");
                    }}
                    isSaving={isSaving}
                  />
                )
              },
              {
                id: "webhooks",
                label: "Webhooks",
                content: (
                  <WebhooksSettings
                    webhooks={webhooks}
                    onSave={async (newWebhooks) => {
                      if (!params?.id) return;
                      setIsSaving(true);
                      try {
                        await updateAgentWebhooks(params.id, newWebhooks);
                        setWebhooks(newWebhooks);
                        showSuccess("Webhooks salvos.");
                      } catch (err) {
                        showError(err instanceof Error ? err.message : "Erro ao salvar webhooks.");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    isSaving={isSaving}
                  />
                )
              },
              {
                id: "transfer-rules",
                label: "Regras de Transferencia",
                badge: String(transferRules.length),
                content: (
                  <TransferRulesSettings
                    rules={transferRules}
                    onCreate={async (payload) => {
                      if (!params?.id) return;
                      const result = await createTransferRule(params.id, payload);
                      setTransferRules((prev) => [...prev, result as Record<string, unknown>]);
                      showSuccess("Regra criada.");
                    }}
                    onUpdate={async (ruleId, payload) => {
                      if (!params?.id) return;
                      await updateTransferRule(params.id, ruleId, payload);
                      setTransferRules((prev) => prev.map((r) => r.id === ruleId ? { ...r, ...payload } : r));
                      showSuccess("Regra atualizada.");
                    }}
                    onDelete={async (ruleId) => {
                      if (!params?.id) return;
                      await deleteTransferRule(params.id, ruleId);
                      setTransferRules((prev) => prev.filter((r) => r.id !== ruleId));
                      showSuccess("Regra removida.");
                    }}
                    isSaving={isSaving}
                  />
                )
              }
            ]}
            defaultTab="conversation"
          />
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader eyebrow="Assistente" title="Configuracao do Assistente" />
        <section className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando...</p>
        </section>
      </AppShell>
    );
  }

  if (!hasAgent) {
    return (
      <AppShell>
        <PageHeader eyebrow="Assistente" title="Configuracao do Assistente" />
        <section className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Nenhum assistente configurado. Crie um assistente primeiro.</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Assistente"
        title={franchise ? connection?.agentName ?? franchise.name : "Configuracao do Assistente"}
        description="Gerencie perfil, personalidade, treinamentos, intencoes e configuracoes tecnicas."
      />

      <TabConfig tabs={tabs} defaultTab="profile" />

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={() => setConfirmClear(true)} className="btn-secondary">
          Limpar assistente
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmClear}
        title="Limpar assistente"
        description="Esta acao remove o assistente atual da unidade."
        confirmLabel="Remover"
        onCancel={() => setConfirmClear(false)}
        onConfirm={async () => {
          if (!params?.id) {
            return;
          }
          setIsSaving(true);
          try {
            await clearFranchiseAgent(params.id, { confirmCriticalChange: true });
            showSuccess("Assistente removido.");
            router.push(`/franquias/${params.id}`);
          } catch (requestError) {
            showError(requestError instanceof Error ? requestError.message : "Nao foi possivel remover o assistente.");
          } finally {
            setIsSaving(false);
            setConfirmClear(false);
          }
        }}
      />

      <IntentionEditModal
        isOpen={Boolean(editingIntentionId && intentionDraft)}
        draft={intentionDraft}
        step={intentionEditStep}
        isSaving={isSaving}
        onStepChange={setIntentionEditStep}
        onChange={(updater) => setIntentionDraft((current) => current ? updater(current) : current)}
        onClose={cancelIntentionEdit}
        onSave={saveIntentionEdit}
      />
    </AppShell>
  );
}
