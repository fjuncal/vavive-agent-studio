"use client";

import { useState, useCallback } from "react";
import { Field } from "@/components/FormSection";
import { RichTextarea, SelectField, ToggleField } from "@/components/FriendlyForm";
import { ChevronLeft, ChevronRight, Check, Plus, X, Trash2 } from "lucide-react";
import clsx from "clsx";

export type IntentionField = {
  name: string;
  jsonName: string;
  description: string;
  type: "STRING" | "URL" | "DATE_TIME" | "DATE" | "NUMBER" | "BOOLEAN";
  required: boolean;
};

export type IntentionHeader = { name: string; value: string };
export type IntentionParam = { name: string; value: string };
export type IntentionVariable = {
  valueExpression: string;
  defaultFieldKey?: string;
  customField?: { id: string; name: string; description: string; type: string; jsonName: string };
};

export type IntentionData = {
  description: string;
  instructions: string;
  details: string;
  type: "WEBHOOK" | "INSTRUCTIONS";
  httpMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers: IntentionHeader[];
  params: IntentionParam[];
  requestBody: string;
  fields: IntentionField[];
  variables: IntentionVariable[];
  autoGenerateParams: boolean;
  autoGenerateBody: boolean;
};

const FIELD_TYPES = [
  { value: "STRING", label: "Texto" },
  { value: "URL", label: "URL" },
  { value: "NUMBER", label: "Numero" },
  { value: "BOOLEAN", label: "Booleano" },
  { value: "DATE", label: "Data" },
  { value: "DATE_TIME", label: "Data e Hora" },
];

const DEFAULT_FIELD_KEYS = [
  { value: "contact_name", label: "Nome do contato" },
  { value: "contact_phone", label: "Telefone do contato" },
  { value: "contact_email", label: "Email do contato" },
  { value: "contact_gender", label: "Genero do contato" },
  { value: "contact_birthday", label: "Aniversario do contato" },
  { value: "contact_job_title", label: "Cargo do contato" },
  { value: "contact_org_name", label: "Empresa do contato" },
  { value: "contact_org_state", label: "Estado da empresa" },
  { value: "contact_org_city", label: "Cidade da empresa" },
  { value: "chat_id", label: "ID do chat" },
];

const HTTP_METHODS = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "PATCH", label: "PATCH" },
];

function Step1Details({ data, onChange }: { data: IntentionData; onChange: (d: IntentionData) => void }) {
  return (
    <div className="space-y-4">
      <Field
        label="Nome da intencao"
        placeholder="Ex: emitir-segunda-via"
        value={data.description}
        onChange={(v) => onChange({ ...data, description: v })}
        required
      />
      <RichTextarea
        label="Quando usar essa intencao"
        placeholder="Descreva em que momento o agente deve executar essa intencao..."
        value={data.instructions}
        onChange={(v) => onChange({ ...data, instructions: v })}
        rows={3}
      />
    </div>
  );
}

function Step2Action({ data, onChange }: { data: IntentionData; onChange: (d: IntentionData) => void }) {
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldDesc, setNewFieldDesc] = useState("");
  const [newFieldType, setNewFieldType] = useState<"STRING" | "URL" | "DATE_TIME" | "DATE" | "NUMBER" | "BOOLEAN">("STRING");

  function addField() {
    if (!newFieldName.trim()) return;
    const jsonName = newFieldName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    onChange({
      ...data,
      fields: [...data.fields, { name: newFieldName, jsonName, description: newFieldDesc, type: newFieldType, required: false }],
    });
    setNewFieldName("");
    setNewFieldDesc("");
  }

  function removeField(index: number) {
    onChange({ ...data, fields: data.fields.filter((_, i) => i !== index) });
  }

  function addHeader() {
    onChange({ ...data, headers: [...data.headers, { name: "", value: "" }] });
  }

  function updateHeader(index: number, field: "name" | "value", value: string) {
    onChange({ ...data, headers: data.headers.map((h, i) => i === index ? { ...h, [field]: value } : h) });
  }

  function removeHeader(index: number) {
    onChange({ ...data, headers: data.headers.filter((_, i) => i !== index) });
  }

  function addParam() {
    onChange({ ...data, params: [...data.params, { name: "", value: "" }] });
  }

  function updateParam(index: number, field: "name" | "value", value: string) {
    onChange({ ...data, params: data.params.map((p, i) => i === index ? { ...p, [field]: value } : p) });
  }

  function removeParam(index: number) {
    onChange({ ...data, params: data.params.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      {/* Coleta de dados */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Coletar dados do cliente (opcional)</h4>
        <div className="space-y-2">
          {data.fields.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{f.name}</span>
                {f.description && <span className="ml-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>{f.description}</span>}
              </div>
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>{FIELD_TYPES.find(t => t.value === f.type)?.label ?? f.type}</span>
              <button type="button" onClick={() => removeField(i)} className="text-rose-500 hover:text-rose-700"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_1fr_120px_auto] gap-2 items-end">
          <Field label="Ex: CPF" placeholder="Nome do campo" value={newFieldName} onChange={setNewFieldName} />
          <Field label="Descricao" placeholder="Utilizado para..." value={newFieldDesc} onChange={setNewFieldDesc} />
          <SelectField label="Tipo" value={newFieldType} onChange={(v) => setNewFieldType(v as typeof newFieldType)} options={FIELD_TYPES} />
          <button type="button" onClick={addField} disabled={!newFieldName.trim()} className="btn-secondary h-9"><Plus size={16} /></button>
        </div>
      </div>

      {/* Acao */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Acao que deve ser feita</h4>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Tipo" value={data.type} onChange={(v) => onChange({ ...data, type: v as IntentionData["type"] })} options={[
            { value: "WEBHOOK", label: "Webhook" },
            { value: "INSTRUCTIONS", label: "Instrucoes" },
          ]} />
          <SelectField label="Metodo HTTP" value={data.httpMethod} onChange={(v) => onChange({ ...data, httpMethod: v as IntentionData["httpMethod"] })} options={HTTP_METHODS} />
          <Field label="URL" placeholder="https://api.exemplo.com/webhook" value={data.url} onChange={(v) => onChange({ ...data, url: v })} />
        </div>
      </div>

      {/* Headers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Headers</h4>
          <button type="button" onClick={addHeader} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"><Plus size={12} /> Adicionar</button>
        </div>
        {data.headers.map((h, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input className="input-field flex-1" placeholder="Nome" value={h.name} onChange={(e) => updateHeader(i, "name", e.target.value)} />
            <input className="input-field flex-1" placeholder="Valor" value={h.value} onChange={(e) => updateHeader(i, "value", e.target.value)} />
            <button type="button" onClick={() => removeHeader(i)} className="text-rose-500 hover:text-rose-700 shrink-0"><X size={16} /></button>
          </div>
        ))}
      </div>

      {/* Params */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Params</h4>
          <button type="button" onClick={addParam} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"><Plus size={12} /> Adicionar</button>
        </div>
        {data.params.map((p, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input className="input-field flex-1" placeholder="Nome" value={p.name} onChange={(e) => updateParam(i, "name", e.target.value)} />
            <input className="input-field flex-1" placeholder="Valor" value={p.value} onChange={(e) => updateParam(i, "value", e.target.value)} />
            <button type="button" onClick={() => removeParam(i)} className="text-rose-500 hover:text-rose-700 shrink-0"><X size={16} /></button>
          </div>
        ))}
      </div>

      {/* Body */}
      <RichTextarea label="Body (JSON)" placeholder='{"key": "value"}' value={data.requestBody} onChange={(v) => onChange({ ...data, requestBody: v })} rows={4} />
    </div>
  );
}

function Step3Output({ data, onChange }: { data: IntentionData; onChange: (d: IntentionData) => void }) {
  const [newVarField, setNewVarField] = useState("contact_name");
  const [newVarExpr, setNewVarExpr] = useState("");

  function addVariable() {
    if (!newVarExpr.trim()) return;
    onChange({
      ...data,
      variables: [...data.variables, { valueExpression: newVarExpr, defaultFieldKey: newVarField }],
    });
    setNewVarExpr("");
  }

  function removeVariable(index: number) {
    onChange({ ...data, variables: data.variables.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      {/* Variaveis */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Persistir variaveis no contato (opcional)</h4>
        <div className="space-y-2">
          {data.variables.map((v, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {DEFAULT_FIELD_KEYS.find(f => f.value === v.defaultFieldKey)?.label ?? v.defaultFieldKey}
                </span>
                <span className="ml-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>{v.valueExpression}</span>
              </div>
              <button type="button" onClick={() => removeVariable(i)} className="text-rose-500 hover:text-rose-700"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2 items-end">
          <div className="flex-1">
            <SelectField label="Salvar no campo" value={newVarField} onChange={setNewVarField} options={DEFAULT_FIELD_KEYS} />
          </div>
          <div className="flex-1">
            <Field label="Valor" placeholder="Expressao ou valor" value={newVarExpr} onChange={setNewVarExpr} />
          </div>
          <button type="button" onClick={addVariable} disabled={!newVarExpr.trim()} className="btn-secondary h-9"><Plus size={16} /></button>
        </div>
      </div>

      {/* Resposta */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Resposta do agente</h4>
        <RichTextarea
          label="Detalhes e instrucoes de saida"
          placeholder="Instrucoes sobre como o agente deve interpretar e usar a resposta da API..."
          value={data.details}
          onChange={(v) => onChange({ ...data, details: v })}
          rows={4}
        />
      </div>
    </div>
  );
}

export function IntentionWizard({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
}: {
  initialData?: Partial<IntentionData>;
  onSave: (data: IntentionData) => void;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntentionData>({
    description: initialData?.description ?? "",
    instructions: initialData?.instructions ?? "",
    details: initialData?.details ?? "",
    type: initialData?.type ?? "WEBHOOK",
    httpMethod: initialData?.httpMethod ?? "POST",
    url: initialData?.url ?? "",
    headers: initialData?.headers ?? [],
    params: initialData?.params ?? [],
    requestBody: initialData?.requestBody ?? "",
    fields: initialData?.fields ?? [],
    variables: initialData?.variables ?? [],
    autoGenerateParams: initialData?.autoGenerateParams ?? false,
    autoGenerateBody: initialData?.autoGenerateBody ?? false,
  });

  const steps = [
    { title: "Detalhes Gerais", component: <Step1Details data={data} onChange={setData} /> },
    { title: "Configurar Acao", component: <Step2Action data={data} onChange={setData} /> },
    { title: "Dados de Saida", component: <Step3Output data={data} onChange={setData} /> },
  ];

  const canNext = step === 0 ? data.description.trim().length > 0 : true;

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              i === step ? "bg-brand-600 text-white" : i < step ? "bg-brand-100 text-brand-700" : "bg-gray-100 dark:bg-gray-800"
            )}
            style={i > step ? { color: "var(--color-text-tertiary)" } : undefined}
          >
            <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
              i === step ? "bg-white text-brand-600" : i < step ? "bg-brand-200 text-brand-700" : "bg-gray-200 dark:bg-gray-700"
            )}>
              {i < step ? <Check size={12} /> : i + 1}
            </span>
            {s.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {steps[step].component}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
        <button type="button" onClick={step === 0 ? onCancel : () => setStep(step - 1)} className="btn-secondary flex items-center gap-2">
          <ChevronLeft size={16} /> {step === 0 ? "Cancelar" : "Voltar"}
        </button>
        {step < steps.length - 1 ? (
          <button type="button" onClick={() => setStep(step + 1)} disabled={!canNext} className="btn-primary flex items-center gap-2">
            Proximo <ChevronRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={() => onSave(data)} disabled={isSaving} className="btn-primary flex items-center gap-2">
            {isSaving ? "Salvando..." : "Salvar Intencao"}
          </button>
        )}
      </div>
    </div>
  );
}
