"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

export function ToggleField({
  label,
  description,
  checked,
  onChange,
  disabled = false
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={clsx("flex items-start gap-3 cursor-pointer group", disabled && "opacity-60 cursor-not-allowed")}>
      <div className="pt-0.5">
        <div
          className={clsx(
            "relative h-6 w-11 rounded-full transition-colors",
            checked ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-700"
          )}
          onClick={() => !disabled && onChange(!checked)}
        >
          <div
            className={clsx(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              checked && "translate-x-5"
            )}
          />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium block" style={{ color: "var(--color-text-primary)" }}>
          {label}
        </span>
        {description && (
          <span className="text-xs mt-0.5 block" style={{ color: "var(--color-text-tertiary)" }}>
            {description}
          </span>
        )}
      </div>
    </label>
  );
}

export function SelectField({
  label,
  description,
  value,
  onChange,
  options,
  disabled = false,
  required = false
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description?: string }[];
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {description && (
        <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{description}</span>
      )}
      <select
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function OptionCards({
  label,
  description,
  value,
  onChange,
  options,
  disabled = false
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description?: string; icon?: ReactNode }[];
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
        {label}
      </span>
      {description && (
        <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{description}</span>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className={clsx(
              "card p-4 text-left transition-all",
              value === opt.value
                ? "ring-2 ring-brand-500 bg-brand-50/50 dark:bg-brand-900/20"
                : "hover:shadow-md"
            )}
          >
            {opt.icon && <div className="mb-2">{opt.icon}</div>}
            <span className="text-sm font-medium block" style={{ color: "var(--color-text-primary)" }}>
              {opt.label}
            </span>
            {opt.description && (
              <span className="text-xs mt-1 block" style={{ color: "var(--color-text-tertiary)" }}>
                {opt.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RichTextarea({
  label,
  description,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  rows = 6
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {description && (
        <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{description}</span>
      )}
      <textarea
        className="input-field min-h-[120px] resize-y font-mono text-sm"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
      />
    </label>
  );
}
