export function TrainingPreviewCard({ title, content }: { title: string; content: string }) {
  return (
    <aside className="rounded-2xl border border-line/80 bg-ink p-5 text-white shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-100">Preview GPTMaker</p>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <div className="mt-4 rounded-xl bg-white/8 p-4 text-sm leading-7 text-white/78">
        {content.split("\n").map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </aside>
  );
}
