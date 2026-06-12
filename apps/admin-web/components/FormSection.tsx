export function FormSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
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
  onChange
}: {
  label: string;
  placeholder?: string;
  textarea?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const className = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50";

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {textarea ? (
        <textarea className={className} rows={4} placeholder={placeholder} value={value} onChange={(event) => onChange?.(event.target.value)} />
      ) : (
        <input className={className} placeholder={placeholder} value={value} onChange={(event) => onChange?.(event.target.value)} />
      )}
    </label>
  );
}
