import clsx from "clsx";

const variants: Record<string, string> = {
  ATIVA: "bg-brand-50 text-brand-700 ring-brand-100",
  ATIVO: "bg-brand-50 text-brand-700 ring-brand-100",
  NOVO: "bg-blue-50 text-blue-700 ring-blue-100",
  EM_ATENDIMENTO: "bg-amber-50 text-amber-700 ring-amber-100",
  CONVERTIDO: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  FINALIZADO: "bg-slate-100 text-slate-700 ring-slate-200"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", variants[status] ?? "bg-slate-100 text-slate-700 ring-slate-200")}>
      {status.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())}
    </span>
  );
}
