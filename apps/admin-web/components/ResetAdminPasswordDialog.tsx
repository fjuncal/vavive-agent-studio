"use client";

import { isAdminPasswordValid, passwordsMatch } from "@/lib/admin-access";
import type { FranchiseAdminUser } from "@/lib/api";
import { KeyRound, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

type ResetAdminPasswordDialogProps = {
  user: FranchiseAdminUser | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  onConfirm: (newPassword: string, confirmPassword: string) => void;
  onCancel: () => void;
};

export function ResetAdminPasswordDialog({
  user,
  isOpen,
  isSubmitting = false,
  onConfirm,
  onCancel
}: ResetAdminPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValidPassword = isAdminPasswordValid(newPassword);
  const hasMatchingPasswords = passwordsMatch(newPassword, confirmPassword);
  const canSubmit = hasValidPassword && hasMatchingPasswords && !isSubmitting;

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, user]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen && !isSubmitting) {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen || !user) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSubmit) {
      onConfirm(newPassword, confirmPassword);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onCancel}
      />
      <div
        className="card relative w-full max-w-md p-6 shadow-soft-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-admin-password-title"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <KeyRound size={22} />
        </div>
        <h2 id="reset-admin-password-title" className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Redefinir senha
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Defina uma nova senha para {user.name}. A senha atual não é exibida.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5" htmlFor="reset-admin-password">
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Nova senha</span>
            <input
              ref={inputRef}
              id="reset-admin-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="input-field"
              disabled={isSubmitting}
              required
              autoComplete="new-password"
              aria-describedby="reset-admin-password-requirements"
            />
          </label>

          <p id="reset-admin-password-requirements" className="-mt-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Mínimo de 8 caracteres, com pelo menos uma letra e um número.
          </p>

          <label className="grid gap-1.5" htmlFor="reset-admin-password-confirmation">
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Confirmar nova senha</span>
            <input
              id="reset-admin-password-confirmation"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="input-field"
              disabled={isSubmitting}
              required
              autoComplete="new-password"
            />
          </label>

          {confirmPassword && !hasMatchingPasswords ? (
            <p className="-mt-2 text-xs text-rose-600" role="alert">As senhas não conferem.</p>
          ) : null}

          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={!canSubmit} className="btn-primary min-w-[125px] disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                "Redefinir senha"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
