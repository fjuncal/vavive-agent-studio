import clsx from "clsx";
import { Check } from "lucide-react";

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
    <div className="card p-4">
      {progressLabel && (
        <div className="mb-4 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 dark:bg-brand-900/20 dark:border-brand-800">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-500 dark:text-brand-400">Progresso</p>
          <p className="mt-1 text-sm font-medium text-brand-700 dark:text-brand-300">{progressLabel}</p>
        </div>
      )}
      <nav className="flex flex-col gap-1">
        {steps.map((step, index) => {
          const isActive = index === current;
          const isDone = completed.includes(index) || index < current;
          const isClickable = onStepClick && (isDone || index <= current);

          return (
            <button
              key={step}
              type="button"
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-200",
                isClickable ? "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" : "cursor-default",
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800"
                  : isDone
                    ? "text-brand-600 dark:text-brand-400"
                    : ""
              )}
              style={!isActive && !isDone ? { color: "var(--color-text-tertiary)" } : undefined}
            >
              <span
                className={clsx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all duration-200",
                  isDone && !isActive
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                    : isActive
                      ? "bg-brand-600 text-white shadow-glow"
                      : "bg-gray-100 dark:bg-gray-800"
                )}
                style={!isDone && !isActive ? { color: "var(--color-text-tertiary)" } : undefined}
              >
                {isDone && !isActive ? (
                  <Check size={16} />
                ) : (
                  index + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <span className={clsx("font-medium block truncate", isActive && "text-brand-700 dark:text-brand-400")}>
                  {step}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
