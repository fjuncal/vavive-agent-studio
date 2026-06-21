"use client";

import { useState } from "react";
import { Field } from "@/components/FormSection";
import { RichTextarea, SelectField, ToggleField } from "@/components/FriendlyForm";
import { BookOpen, Globe, Video, FileText, Database, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

export type TrainingItem =
  | { type: "TEXT"; text: string }
  | { type: "WEBSITE"; website: string; trainingSubPages: "DISABLED" | "ACTIVE"; trainingInterval: string }
  | { type: "VIDEO"; video: string }
  | { type: "DOCUMENT"; documentUrl: string; documentName: string; documentMimetype: string };

const TRAINING_TYPES = [
  { value: "TEXT", label: "Texto", icon: BookOpen, description: "Afirmacoes de conhecimento" },
  { value: "WEBSITE", label: "Website", icon: Globe, description: "Treinar via URL do site" },
  { value: "VIDEO", label: "Video", icon: Video, description: "Treinar via URL de video" },
  { value: "DOCUMENT", label: "Documento", icon: FileText, description: "Upload de documento" },
];

const INTERVAL_OPTIONS = [
  { value: "NEVER", label: "Nunca" },
  { value: "THIRTY_SECONDS", label: "30 segundos" },
  { value: "ONE_HOUR", label: "1 hora" },
  { value: "FOUR_HOUR", label: "4 horas" },
  { value: "EIGHT_HOUR", label: "8 horas" },
  { value: "TWELVE_HOUR", label: "12 horas" },
  { value: "ONE_DAY", label: "1 dia" },
  { value: "ONE_WEEK", label: "1 semana" },
  { value: "ONE_MONTH", label: "1 mes" },
];

function TextTrainingEditor({ items, onChange }: { items: TrainingItem[]; onChange: (items: TrainingItem[]) => void }) {
  const [newText, setNewText] = useState("");
  const textItems = items.filter((i): i is { type: "TEXT"; text: string } => i.type === "TEXT");

  function handleAdd() {
    if (!newText.trim()) return;
    onChange([...items, { type: "TEXT", text: newText.trim() }]);
    setNewText("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleRemove(index: number) {
    const textIdx = textItems[index];
    onChange(items.filter((_, i) => i !== items.indexOf(textIdx)));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {textItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
            <BookOpen size={16} className="mt-0.5 shrink-0 text-brand-500" />
            <p className="flex-1 text-sm" style={{ color: "var(--color-text-primary)" }}>{item.text}</p>
            <button type="button" onClick={() => handleRemove(i)} className="shrink-0 text-rose-500 hover:text-rose-700">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Escreva uma afirmacao e tecle Enter para cadastrar"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" onClick={handleAdd} disabled={!newText.trim()} className="btn-secondary shrink-0">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function WebsiteTrainingEditor({ items, onChange }: { items: TrainingItem[]; onChange: (items: TrainingItem[]) => void }) {
  const [url, setUrl] = useState("");
  const [subPages, setSubPages] = useState<"DISABLED" | "ACTIVE">("DISABLED");
  const [interval, setInterval] = useState("ONE_WEEK");
  const webItems = items.filter((i): i is { type: "WEBSITE"; website: string; trainingSubPages: "DISABLED" | "ACTIVE"; trainingInterval: string } => i.type === "WEBSITE");

  function handleAdd() {
    if (!url.trim()) return;
    onChange([...items, { type: "WEBSITE", website: url.trim(), trainingSubPages: subPages, trainingInterval: interval }]);
    setUrl("");
  }

  function handleRemove(index: number) {
    const webIdx = webItems[index];
    onChange(items.filter((_, i) => i !== items.indexOf(webIdx)));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {webItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
            <Globe size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{item.website}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                Sub-paginas: {item.trainingSubPages === "ACTIVE" ? "Sim" : "Nao"} | Atualizacao: {INTERVAL_OPTIONS.find(o => o.value === item.trainingInterval)?.label ?? item.trainingInterval}
              </p>
            </div>
            <button type="button" onClick={() => handleRemove(i)} className="shrink-0 text-rose-500 hover:text-rose-700">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--color-border)" }}>
        <Field label="URL do website" placeholder="https://exemplo.com" value={url} onChange={setUrl} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Intervalo de atualizacao" value={interval} onChange={setInterval} options={INTERVAL_OPTIONS} />
          <ToggleField label="Navegar sub-paginas" description="Rastrear links internos" checked={subPages === "ACTIVE"} onChange={(v) => setSubPages(v ? "ACTIVE" : "DISABLED")} />
        </div>
        <button type="button" onClick={handleAdd} disabled={!url.trim()} className="btn-secondary text-sm">
          <Plus size={14} /> Adicionar website
        </button>
      </div>
    </div>
  );
}

function VideoTrainingEditor({ items, onChange }: { items: TrainingItem[]; onChange: (items: TrainingItem[]) => void }) {
  const [url, setUrl] = useState("");
  const videoItems = items.filter((i): i is { type: "VIDEO"; video: string } => i.type === "VIDEO");

  function handleAdd() {
    if (!url.trim()) return;
    onChange([...items, { type: "VIDEO", video: url.trim() }]);
    setUrl("");
  }

  function handleRemove(index: number) {
    const vidIdx = videoItems[index];
    onChange(items.filter((_, i) => i !== items.indexOf(vidIdx)));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {videoItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
            <Video size={16} className="mt-0.5 shrink-0 text-purple-500" />
            <p className="flex-1 text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{item.video}</p>
            <button type="button" onClick={() => handleRemove(i)} className="shrink-0 text-rose-500 hover:text-rose-700">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Cole a URL do video (YouTube, Vimeo, etc.)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="button" onClick={handleAdd} disabled={!url.trim()} className="btn-secondary shrink-0">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function DocumentTrainingEditor({ items, onChange }: { items: TrainingItem[]; onChange: (items: TrainingItem[]) => void }) {
  const docItems = items.filter((i): i is { type: "DOCUMENT"; documentUrl: string; documentName: string; documentMimetype: string } => i.type === "DOCUMENT");

  function handleAdd() {
    onChange([...items, { type: "DOCUMENT", documentUrl: "", documentName: "documento.pdf", documentMimetype: "application/pdf" }]);
  }

  function handleUpdate(index: number, field: string, value: string) {
    const docIdx = docItems[index];
    const globalIdx = items.indexOf(docIdx);
    const next = items.map((item, i) => i === globalIdx ? { ...item, [field]: value } : item);
    onChange(next);
  }

  function handleRemove(index: number) {
    const docIdx = docItems[index];
    onChange(items.filter((_, i) => i !== items.indexOf(docIdx)));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {docItems.map((item, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-amber-500" />
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{item.documentName || "Documento"}</span>
              </div>
              <button type="button" onClick={() => handleRemove(i)} className="text-rose-500 hover:text-rose-700">
                <X size={16} />
              </button>
            </div>
            <Field label="URL do documento" placeholder="https://storage.exemplo.com/doc.pdf" value={item.documentUrl} onChange={(v) => handleUpdate(i, "documentUrl", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome do arquivo" placeholder="documento.pdf" value={item.documentName} onChange={(v) => handleUpdate(i, "documentName", v)} />
              <SelectField label="Tipo" value={item.documentMimetype} onChange={(v) => handleUpdate(i, "documentMimetype", v)} options={[
                { value: "application/pdf", label: "PDF" },
                { value: "application/msword", label: "DOC" },
                { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "DOCX" },
                { value: "text/plain", label: "TXT" },
              ]} />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={handleAdd} className="btn-secondary text-sm">
        <Plus size={14} /> Adicionar documento
      </button>
    </div>
  );
}

export function TrainingEditor({ items, onChange, disabled = false }: { items: TrainingItem[]; onChange: (items: TrainingItem[]) => void; disabled?: boolean }) {
  const [activeTab, setActiveTab] = useState<"TEXT" | "WEBSITE" | "VIDEO" | "DOCUMENT">("TEXT");

  const tabs = [
    { key: "TEXT" as const, label: "Texto", icon: BookOpen },
    { key: "WEBSITE" as const, label: "Website", icon: Globe },
    { key: "VIDEO" as const, label: "Video", icon: Video },
    { key: "DOCUMENT" as const, label: "Documento", icon: FileText },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--color-border)" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = items.filter((i) => i.type === tab.key).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.key
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent hover:border-gray-300"
              )}
              style={activeTab !== tab.key ? { color: "var(--color-text-secondary)" } : undefined}
            >
              <Icon size={16} />
              {tab.label}
              {count > 0 && (
                <span className="ml-1 rounded-full bg-brand-100 text-brand-700 px-1.5 py-0.5 text-xs">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {disabled ? (
        <div className="rounded-xl border p-4 text-center text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-tertiary)" }}>
          Modo somente leitura.
        </div>
      ) : (
        <>
          {activeTab === "TEXT" && <TextTrainingEditor items={items} onChange={onChange} />}
          {activeTab === "WEBSITE" && <WebsiteTrainingEditor items={items} onChange={onChange} />}
          {activeTab === "VIDEO" && <VideoTrainingEditor items={items} onChange={onChange} />}
          {activeTab === "DOCUMENT" && <DocumentTrainingEditor items={items} onChange={onChange} />}
        </>
      )}
    </div>
  );
}
