"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function RuleBuilderCard({ title, description, defaultChecked = true }: { title: string; description: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label className="flex cursor-pointer gap-4 rounded-2xl border border-line/80 bg-white/86 p-4 shadow-sm transition hover:border-brand-100 hover:bg-brand-50/30">
      <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-ink">{title}</h3>
          {checked ? <CheckCircle2 size={16} className="text-brand-600" /> : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </label>
  );
}
