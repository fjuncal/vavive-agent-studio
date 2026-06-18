"use client";

import { useState, useCallback, type ReactNode } from "react";
import clsx from "clsx";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  isValid?: boolean;
}

export function FormWizard({
  steps,
  onComplete,
  onStepChange,
  submitLabel = "Criar",
  isSubmitting = false
}: {
  steps: WizardStep[];
  onComplete: () => void;
  onStepChange?: (stepIndex: number) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
      onStepChange?.(index);
    }
  }, [steps.length, onStepChange]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const step = steps[currentStep];
      if (step.isValid === false) return;
      goTo(currentStep + 1);
    }
  }, [currentStep, steps, goTo]);

  const prev = useCallback(() => {
    if (currentStep > 0) {
      goTo(currentStep - 1);
    }
  }, [currentStep, goTo]);

  const isLast = currentStep === steps.length - 1;
  const current = steps[currentStep];

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Sidebar stepper */}
      <div className="card p-4 h-fit lg:sticky lg:top-6">
        <nav className="flex flex-col gap-1">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isDone = index < currentStep;
            const isClickable = index <= currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isClickable && goTo(index)}
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
                  {isDone && !isActive ? <Check size={16} /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className={clsx("font-medium block truncate", isActive && "text-brand-700 dark:text-brand-400")}>
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-xs truncate block mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                      {step.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content area */}
      <div className="space-y-6">
        <div className="card p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-500 dark:text-brand-400">
              Passo {currentStep + 1} de {steps.length}
            </p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {current.title}
            </h2>
            {current.description && (
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {current.description}
              </p>
            )}
          </div>

          <div>{current.content}</div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            disabled={currentStep === 0}
            className={clsx(
              "btn-secondary flex items-center gap-2",
              currentStep === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronLeft size={16} />
            Voltar
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={onComplete}
              disabled={isSubmitting || current.isValid === false}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Criando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  {submitLabel}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={current.isValid === false}
              className="btn-primary flex items-center gap-2"
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
