import type { WorkspaceCredits } from "@/lib/api";

export function getCreditsNumbers(credits?: WorkspaceCredits | null) {
  return {
    total: Math.max(0, Number(credits?.credits ?? 0)),
    used: Math.max(0, Number(credits?.used ?? 0)),
    remaining: Math.max(0, Number(credits?.remaining ?? 0))
  };
}

export function getCreditsPercentage(credits?: WorkspaceCredits | null) {
  const { total, remaining } = getCreditsNumbers(credits);
  if (!total) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));
}

export function formatCreditsStatus(status?: WorkspaceCredits["status"]) {
  switch (status) {
    case "AVAILABLE":
      return "disponivel";
    case "NO_WORKSPACE":
      return "sem workspace";
    case "UNAVAILABLE":
    default:
      return "indisponivel";
  }
}
