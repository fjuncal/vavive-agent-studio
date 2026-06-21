"use client";

import { useEffect, useState, useRef } from "react";

const STATUS_OPTIONS = [
  { key: "ATIVA", label: "Ativo", color: "#22C55E" },
  { key: "INATIVA", label: "Desativado", color: "#EF4444" },
  // Temporarily hidden because GPTMaker does not currently allow this status update through our API token.
  // { key: "TRAINING", label: "Em treinamento", color: "#EAB308" },
];

const ALL_STATUS: Record<string, { label: string; color: string }> = {
  ATIVA: { label: "Ativo", color: "#22C55E" },
  ATIVO: { label: "Ativo", color: "#22C55E" },
  ACTIVE: { label: "Ativo", color: "#22C55E" },
  INATIVA: { label: "Desativado", color: "#EF4444" },
  INATIVO: { label: "Desativado", color: "#EF4444" },
  INACTIVE: { label: "Desativado", color: "#EF4444" },
  TRAINING: { label: "Em treinamento", color: "#EAB308" },
  EM_TREINAMENTO: { label: "Em treinamento", color: "#EAB308" },
};

export function getStatusDisplay(status: string) {
  return ALL_STATUS[status] || { label: status, color: "#6B7280" };
}

export function StatusDropdown({ currentStatus, onChange, disabled }: { currentStatus: string; onChange: (status: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = ALL_STATUS[currentStatus] || ALL_STATUS["ATIVA"];
  const normalizedCurrentStatus = currentStatus === "EM_TREINAMENTO" ? "TRAINING" : currentStatus;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full transition hover:opacity-80 cursor-pointer"
        style={{ background: `${current.color}15`, border: `1px solid ${current.color}40` }}
        disabled={disabled}
      >
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: current.color }} />
        <span className="text-sm font-medium" style={{ color: current.color }}>{current.label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: current.color }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 w-48 rounded-xl border shadow-lg overflow-hidden" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-primary)" }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                onChange(opt.key);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:opacity-80 transition"
              style={{ color: "var(--color-text-primary)" }}
            >
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: opt.color }} />
              <span className="flex-1">{opt.label}</span>
              {opt.key === normalizedCurrentStatus && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8L7 11L12 5" stroke={opt.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
