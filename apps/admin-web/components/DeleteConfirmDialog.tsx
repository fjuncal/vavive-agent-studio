"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

type DeleteConfirmDialogProps = {
  title: string;
  description: string;
  confirmText: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmDialog({
  title,
  description,
  confirmText,
  isOpen,
  isSubmitting = false,
  onConfirm,
  onCancel
}: DeleteConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isConfirmed = inputValue.trim().toLowerCase() === confirmText.toLowerCase();

  useEffect(() => {
    if (isOpen) {
      setInputValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen && !isSubmitting) {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onCancel}
      />
      <div className="card relative w-full max-w-md p-6 shadow-soft-lg animate-scale-in">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
          <AlertTriangle size={24} />
        </div>

        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>{description}</p>

        <div className="mt-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Digite <span className="font-bold text-rose-600">{confirmText}</span> para confirmar:
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="input-field"
              placeholder={confirmText}
              disabled={isSubmitting}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isConfirmed || isSubmitting}
            className="btn-primary bg-rose-600 hover:bg-rose-700 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Removendo...
              </>
            ) : (
              "Remover"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
