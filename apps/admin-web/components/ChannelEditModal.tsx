"use client";

import { Loader2, PencilLine, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ChannelEditModalProps {
  isOpen: boolean;
  name: string;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void> | void;
}

export function ChannelEditModal({ isOpen, name, isSaving = false, onClose, onSave }: ChannelEditModalProps) {
  const [draftName, setDraftName] = useState(name);

  useEffect(() => {
    if (isOpen) {
      setDraftName(name);
    }
  }, [isOpen, name]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PencilLine size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Editar canal</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Nome do canal</span>
          <input className="input-field" value={draftName} onChange={(event) => setDraftName(event.target.value)} />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="button" onClick={() => onSave(draftName.trim())} disabled={!draftName.trim() || isSaving} className="btn-primary">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
