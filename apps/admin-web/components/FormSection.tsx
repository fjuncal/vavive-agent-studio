export function FormSection({
  title,
  description,
  icon,
  children,
  variant = "default"
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "highlighted";
}) {
  return (
    <section className={`card ${variant === "highlighted" ? "ring-2 ring-brand-200 dark:ring-brand-800 bg-brand-50/30 dark:bg-brand-900/10" : ""}`}>
      <div className="mb-5 flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
          {description && <p className="mt-1 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>{description}</p>}
        </div>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  placeholder,
  textarea = false,
  value,
  onChange,
  required = false,
  disabled = false,
  type = "text",
  hint,
  icon
}: {
  label: string;
  placeholder?: string;
  textarea?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-text-primary)" }}>
        {icon}
        {label}
        {required && <span className="text-rose-500 dark:text-rose-400">*</span>}
      </span>
      {textarea ? (
        <textarea
          className="input-field min-h-[120px] resize-y"
          rows={4}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          required={required}
        />
      ) : (
        <input
          className="input-field"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          required={required}
        />
      )}
      {hint && <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{hint}</span>}
    </label>
  );
}
