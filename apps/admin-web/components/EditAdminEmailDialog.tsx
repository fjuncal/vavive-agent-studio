"use client";

import { normalizeAdministrativeEmail } from "@/lib/admin-access";
import type { FranchiseAdminUser } from "@/lib/api";
import { Loader2, Mail } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

type EditAdminEmailDialogProps = {
  user: FranchiseAdminUser | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  onConfirm: (email: string) => void;
  onCancel: () => void;
};

export function EditAdminEmailDialog({
  user,
  isOpen,
  isSubmitting = false,
  onConfirm,
  onCancel
}: EditAdminEmailDialogProps) {
  const [email, setEmail] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }
    setEmail(user.email);
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
    const normalizedEmail = normalizeAdministrativeEmail(email);
    if (normalizedEmail) {
      onConfirm(normalizedEmail);
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
        aria-labelledby="edit-admin-email-title"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Mail size={22} />
        </div>
        <h2 id="edit-admin-email-title" className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Editar e-mail
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Atualize somente o e-mail de login de {user.name}.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5" htmlFor="edit-admin-email">
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Novo e-mail</span>
            <input
              ref={inputRef}
              id="edit-admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field"
              disabled={isSubmitting}
              required
              autoComplete="email"
            />
          </label>

          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={!email.trim() || isSubmitting} className="btn-primary min-w-[125px]">
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar e-mail"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
