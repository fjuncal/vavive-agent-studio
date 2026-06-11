import clsx from "clsx";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-line/80 bg-white/86 p-3 shadow-soft sm:grid-cols-3 lg:grid-cols-1">
      {steps.map((step, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <div key={step} className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm", active ? "bg-brand-50 text-brand-700" : "text-slate-600")}>
            <span className={clsx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", done || active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500")}>
              {index + 1}
            </span>
            <span className="font-medium">{step}</span>
          </div>
        );
      })}
    </div>
  );
}
