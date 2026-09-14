"use client";

import { isExactFranchiseName } from "@/lib/admin-access";
import { Loader2, ShieldOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type DeactivateFranchiseDialogProps = {
  franchiseName: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeactivateFranchiseDialog({
  franchiseName,
  isOpen,
  isSubmitting = false,
  onConfirm,
  onCancel
}: DeactivateFranchiseDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isConfirmed = franchiseName.length > 0 && isExactFranchiseName(confirmation, franchiseName);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setConfirmation("");
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onCancel}
      />
      <div
        className="card relative w-full max-w-lg p-6 shadow-soft-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-franchise-title"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
          <ShieldOff size={23} />
        </div>
        <h2 id="deactivate-franchise-title" className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Desativar franquia
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>
          Ao desativar esta franquia, os usuários vinculados perderão acesso à plataforma até que a franquia seja reativada. Nenhum dado será excluído.
        </p>

        <label className="mt-5 grid gap-1.5" htmlFor="deactivate-franchise-confirmation">
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Digite <span className="font-semibold text-rose-600">&quot;{franchiseName}&quot;</span> para confirmar.
          </span>
          <input
            ref={inputRef}
            id="deactivate-franchise-confirmation"
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="input-field"
            placeholder={franchiseName}
            disabled={isSubmitting}
            autoComplete="off"
          />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isConfirmed || isSubmitting}
            className="btn-primary min-w-[140px] bg-rose-600 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Desativando...
              </>
            ) : (
              "Desativar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
