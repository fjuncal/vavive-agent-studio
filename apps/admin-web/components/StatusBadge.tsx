import clsx from "clsx";

const variants: Record<string, string> = {
  ATIVA: "bg-brand-50 text-brand-700 ring-brand-100",
  INATIVA: "bg-slate-100 text-slate-700 ring-slate-200",
  ATIVO: "bg-brand-50 text-brand-700 ring-brand-100",
  SEM_AGENTE: "bg-amber-50 text-amber-700 ring-amber-100",
  PENDENTE_CONFIGURACAO: "bg-amber-50 text-amber-700 ring-amber-100",
  SEM_WORKSPACE: "bg-amber-50 text-amber-700 ring-amber-100",
  NOVO: "bg-blue-50 text-blue-700 ring-blue-100",
  EM_ATENDIMENTO: "bg-amber-50 text-amber-700 ring-amber-100",
  CONVERTIDO: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  FINALIZADO: "bg-slate-100 text-slate-700 ring-slate-200",
  SALVO_LOCALMENTE: "bg-slate-100 text-slate-700 ring-slate-200",
  PUBLICADO_GPTMAKER: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  PUBLICADO_GPTMAKER_MOCK: "bg-violet-50 text-violet-700 ring-violet-100",
  PUBLICACAO_FALHOU: "bg-rose-50 text-rose-700 ring-rose-100",
  ENVIADO_GPTMAKER: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  ENVIADO_GPTMAKER_MOCK: "bg-violet-50 text-violet-700 ring-violet-100",
  ENVIO_FALHOU: "bg-rose-50 text-rose-700 ring-rose-100",
  CONECTADO: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  NAO_CONECTADO: "bg-amber-50 text-amber-700 ring-amber-100",
  CONNECTED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  ERROR: "bg-rose-50 text-rose-700 ring-rose-100",
  READY: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  MOCK: "bg-violet-50 text-violet-700 ring-violet-100",
  MISSING_TOKEN: "bg-amber-50 text-amber-700 ring-amber-100"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", variants[status] ?? "bg-slate-100 text-slate-700 ring-slate-200")}>
      {status.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())}
    </span>
  );
}
