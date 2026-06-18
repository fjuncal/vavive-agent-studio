import clsx from "clsx";

const variants: Record<string, { bg: string; text: string; ring: string }> = {
  ATIVA: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" },
  INATIVA: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", ring: "ring-gray-200 dark:ring-gray-700" },
  ATIVO: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" },
  SEM_AGENTE: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800" },
  PENDENTE_CONFIGURACAO: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800" },
  SEM_WORKSPACE: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800" },
  NOVO: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", ring: "ring-blue-200 dark:ring-blue-800" },
  EM_ATENDIMENTO: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800" },
  CONVERTIDO: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" },
  FINALIZADO: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", ring: "ring-gray-200 dark:ring-gray-700" },
  SALVO_LOCALMENTE: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", ring: "ring-gray-200 dark:ring-gray-700" },
  PUBLICADO_GPTMAKER: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" },
  PUBLICADO_GPTMAKER_MOCK: { bg: "bg-violet-50 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", ring: "ring-violet-200 dark:ring-violet-800" },
  PUBLICACAO_FALHOU: { bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", ring: "ring-rose-200 dark:ring-rose-800" },
  ENVIADO_GPTMAKER: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" },
  ENVIADO_GPTMAKER_MOCK: { bg: "bg-violet-50 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", ring: "ring-violet-200 dark:ring-violet-800" },
  ENVIO_FALHOU: { bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", ring: "ring-rose-200 dark:ring-rose-800" },
  CONECTADO: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" },
  NAO_CONECTADO: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800" },
  CONNECTED: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" },
  ERROR: { bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", ring: "ring-rose-200 dark:ring-rose-800" },
  READY: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" },
  MOCK: { bg: "bg-violet-50 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", ring: "ring-violet-200 dark:ring-violet-800" },
  MISSING_TOKEN: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800" }
};

const labels: Record<string, string> = {
  PUBLICADO_GPTMAKER: "Publicado",
  PUBLICADO_GPTMAKER_MOCK: "Publicado (simulado)",
  ENVIADO_GPTMAKER: "Sincronizado",
  ENVIADO_GPTMAKER_MOCK: "Sincronizado (simulado)",
  PUBLICACAO_FALHOU: "Falha de publicacao",
  ENVIO_FALHOU: "Falha de sincronizacao",
  PENDENTE_CONFIGURACAO: "Configuracao pendente",
  SEM_AGENTE: "Sem assistente",
  SEM_WORKSPACE: "Sem workspace",
  CONECTADO: "Conectado",
  NAO_CONECTADO: "Nao conectado",
  CONNECTED: "Conectado",
  READY: "Pronto",
  MOCK: "Simulado",
  MISSING_TOKEN: "Token ausente"
};

function formatStatus(status: string): string {
  if (labels[status]) {
    return labels[status];
  }
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const variant = variants[status] ?? { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", ring: "ring-gray-200 dark:ring-gray-700" };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-semibold ring-1 ring-inset",
        variant.bg,
        variant.text,
        variant.ring,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {formatStatus(status)}
    </span>
  );
}
