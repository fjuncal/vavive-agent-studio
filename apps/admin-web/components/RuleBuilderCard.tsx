"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export function RuleBuilderCard({
  title,
  description,
  defaultChecked = true,
  checked: controlledChecked,
  onCheckedChange
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  const isControlled = typeof controlledChecked === "boolean";

  useEffect(() => {
    if (isControlled) {
      setChecked(controlledChecked);
    }
  }, [controlledChecked, isControlled]);

  return (
    <label className="flex cursor-pointer gap-4 rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:border-brand-200 hover:bg-brand-50/20 hover:shadow-md dark:hover:border-brand-800 dark:hover:bg-brand-900/10" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-primary)" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          const nextChecked = event.target.checked;
          if (!isControlled) {
            setChecked(nextChecked);
          }
          onCheckedChange?.(nextChecked);
        }}
        className="mt-1 h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
        style={{ borderColor: "var(--color-border)" }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
          {checked && (
            <CheckCircle2 size={16} className="text-brand-600 dark:text-brand-400" />
          )}
        </div>
        <p className="mt-1 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
      </div>
    </label>
  );
}
