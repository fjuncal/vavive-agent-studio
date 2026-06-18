export function TrainingPreviewCard({ title, content }: { title: string; content: string }) {
  return (
    <aside className="rounded-2xl bg-ink p-5 text-white shadow-soft-lg relative overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full -translate-y-10 translate-x-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-500/5 rounded-full translate-y-8 -translate-x-8" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300 dark:text-brand-400">Preview</p>
        <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
        <div className="mt-4 rounded-xl bg-white/8 dark:bg-white/5 p-4 text-sm leading-7 text-white/70 max-h-[400px] overflow-y-auto scrollbar-thin">
          {content.split("\n").map((line, index) => (
            <p key={index} className={line.startsWith("CONTEXTO") || line.startsWith("PERSONALIZACAO") || line.startsWith("SERVICOS") || line.startsWith("REGRAS") || line.startsWith("EXEMPLOS") ? "text-brand-300 dark:text-brand-400 font-semibold mt-2 first:mt-0" : ""}>
              {line || "\u00A0"}
            </p>
          ))}
        </div>
      </div>
    </aside>
  );
}
