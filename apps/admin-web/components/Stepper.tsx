import clsx from "clsx";

export function Stepper({
  steps,
  current,
  completed = [],
  onStepClick,
  progressLabel
}: {
  steps: string[];
  current: number;
  completed?: number[];
  onStepClick?: (index: number) => void;
  progressLabel?: string;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-line/80 bg-white/86 p-3 shadow-soft sm:grid-cols-3 lg:grid-cols-1">
      {progressLabel ? (
        <div className="rounded-xl bg-brand-50 px-3 py-3 text-sm text-brand-700 sm:col-span-3 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Setup guiado</p>
          <p className="mt-1 font-medium">{progressLabel}</p>
        </div>
      ) : null}
      {steps.map((step, index) => {
        const active = index === current;
        const done = completed.includes(index) || index < current;
        return (
          <button
            key={step}
            type="button"
            onClick={() => onStepClick?.(index)}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
              onStepClick ? "hover:bg-slate-50" : "cursor-default",
              active ? "bg-brand-50 text-brand-700" : "text-slate-600"
            )}
          >
            <span className={clsx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", done || active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500")}>
              {index + 1}
            </span>
            <span className="font-medium">{step}</span>
          </button>
        );
      })}
    </div>
  );
}
