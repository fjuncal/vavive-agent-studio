"use client";

import { AppShell } from "@/components/AppShell";
import { AssistantAvatar } from "@/components/AssistantAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth";
import {
  activateAgent,
  inactivateAgent,
  deleteGptMakerAgent,
  getAgents,
  getFranchises,
  type AgentSummary,
  type FranchiseSummary
} from "@/lib/api";
import { Bot, Building2, ExternalLink, ArrowRight, MoreVertical, Settings, PowerOff, Power, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getMultiAvatarUrl(seed: string): string {
  const hash = hashCode(seed);
  return `https://api.multiavatar.com/${hash}.svg`;
}

function statusFor(franchise: FranchiseSummary) {
  if (!franchise.workspaceId) {
    return "PENDENTE_CONFIGURACAO";
  }
  if (!franchise.agentId) {
    return "SEM_AGENTE";
  }
  return franchise.status || "ATIVA";
}

function AgentMenu({ franchiseId, status, onRefresh }: { franchiseId: string; status: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "inactivate" | "activate" | "delete">(null);
  const ref = useRef<HTMLDivElement>(null);
  const { error: showError, success: showSuccess } = useToast();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = status === "ATIVA" || status === "ATIVO";

  async function handleAction(action: string) {
    try {
      if (action === "inactivate") {
        await inactivateAgent(franchiseId);
        showSuccess("Agente inativado.");
      } else if (action === "activate") {
        await activateAgent(franchiseId);
        showSuccess("Agente ativado.");
      } else if (action === "delete") {
        await deleteGptMakerAgent(franchiseId);
        showSuccess("Agente removido.");
      }
      onRefresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erro ao executar acao.");
    }
    setConfirmAction(null);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <MoreVertical size={18} style={{ color: "var(--color-text-secondary)" }} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border bg-white shadow-lg dark:bg-slate-900" style={{ borderColor: "var(--color-border)" }}>
          <Link href={`/franquias/${franchiseId}/agente/configuracao`} onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800" style={{ color: "var(--color-text-primary)" }}>
            <Settings size={14} /> Editar configuracao
          </Link>
          {isActive ? (
            <button type="button" onClick={() => setConfirmAction("inactivate")} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800" style={{ color: "var(--color-text-primary)" }}>
              <PowerOff size={14} /> Inativar agente
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmAction("activate")} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800" style={{ color: "var(--color-text-primary)" }}>
              <Power size={14} /> Ativar agente
            </button>
          )}
          <button type="button" onClick={() => setConfirmAction("delete")} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 size={14} /> Remover agente
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmAction === "inactivate"}
        title="Inativar agente"
        description="O agente parara de responder nas conversas. Deseja continuar?"
        confirmLabel="Inativar"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleAction("inactivate")}
      />
      <ConfirmDialog
        isOpen={confirmAction === "activate"}
        title="Ativar agente"
        description="O agente voltara a responder nas conversas. Deseja continuar?"
        confirmLabel="Ativar"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleAction("activate")}
      />
      <DeleteConfirmDialog
        isOpen={confirmAction === "delete"}
        title="Remover agente"
        description="Esta acao remove o agente permanentemente do GPTMaker e do sistema. Todas as configuracoes, treinamentos e intencoes serao perdidos."
        confirmText="remover"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleAction("delete")}
      />
    </div>
  );
}

function AgentListItem({ franchise, agent, onRefresh }: { franchise: FranchiseSummary; agent?: AgentSummary; onRefresh: () => void }) {
  const status = statusFor(franchise);
  const statusConfig = (() => {
    switch (status) {
      case "ATIVA":
      case "ATIVO":
      case "ACTIVE":
        return { label: "Ativo", color: "#22C55E" };
      case "EM_TREINAMENTO":
      case "TRAINING":
        return { label: "Em treinamento", color: "#EAB308" };
      case "INATIVA":
      case "INATIVO":
      case "INACTIVE":
        return { label: "Desativado", color: "#EF4444" };
      default:
        return { label: status, color: "#6B7280" };
    }
  })();

  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="relative shrink-0">
        <AssistantAvatar
          src={agent?.avatar || getMultiAvatarUrl(franchise.name)}
          alt={agent?.name ?? franchise.agentName ?? franchise.name}
          fallbackLabel={franchise.name}
          className="h-12 w-12"
        />
        <div
          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2"
          style={{ backgroundColor: statusConfig.color, borderColor: "var(--color-bg-primary)" }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
            {agent?.name ?? franchise.agentName ?? franchise.name}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusConfig.color }} />
            <span className="text-xs font-medium" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
          </div>
        </div>
        <p className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>
          {franchise.name} — {franchise.city}/{franchise.state}
        </p>
      </div>
      <AgentMenu franchiseId={franchise.id} status={status} onRefresh={onRefresh} />
    </div>
  );
}

function FranchiseCard({ franchise, agent, isSuperAdmin }: { franchise: FranchiseSummary; agent?: AgentSummary; isSuperAdmin: boolean }) {
  const status = statusFor(franchise);
  const agentCount = agent ? 1 : 0;
  const statusConfig = (() => {
    switch (status) {
      case "ATIVA":
      case "ATIVO":
      case "ACTIVE":
        return { label: "Ativo", color: "#22C55E" };
      case "EM_TREINAMENTO":
      case "TRAINING":
        return { label: "Em treinamento", color: "#EAB308" };
      case "INATIVA":
      case "INATIVO":
      case "INACTIVE":
        return { label: "Desativado", color: "#EF4444" };
      default:
        return { label: status, color: "#6B7280" };
    }
  })();

  return (
    <article className="card-interactive group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="relative">
            {agent?.avatar ? (
              <img src={agent.avatar} alt={agent.name} className="h-12 w-12 rounded-2xl object-cover ring-1" style={{ borderColor: "var(--color-border)" }} />
            ) : (
              <img src={getMultiAvatarUrl(franchise.name)} alt={franchise.name} className="h-12 w-12 rounded-2xl object-cover ring-1" style={{ borderColor: "var(--color-border)" }} />
            )}
            <div
              className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2"
              style={{ backgroundColor: statusConfig.color, borderColor: "var(--color-bg-primary)" }}
            />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{franchise.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusConfig.color }} />
                <span className="text-xs font-medium" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
              </div>
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{franchise.city} / {franchise.state}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-4 rounded-xl p-4 text-sm" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
        <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>
          <Bot size={16} className="text-brand-600 dark:text-brand-400" />
          Agente
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span>{agent?.name ?? franchise.agentName ?? "Nao configurado"}</span>
          {agent && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusConfig.color }} />
              <span className="text-xs" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
          {agentCount} {agentCount === 1 ? "agente" : "agentes"}
        </span>
        <Link
          href={franchise.agentId ? `/franquias/${franchise.id}/agente/configuracao` : `/franquias/${franchise.id}/agente/novo`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {franchise.agentId ? "Abrir agente" : "Criar agente"}
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={franchise.agentId ? `/franquias/${franchise.id}/agente/configuracao` : `/franquias/${franchise.id}/agente/novo`}
          className="btn-primary py-2 px-4 text-xs"
        >
          {franchise.agentId ? "Abrir agente" : "Criar agente"}
        </Link>
        {franchise.agentId && (
          <Link href={`/franquias/${franchise.id}`} className="btn-secondary py-2 px-4 text-xs">
            <ExternalLink size={14} />
            Franquia
          </Link>
        )}
      </div>
    </article>
  );
}

export default function AgentsPage() {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    Promise.allSettled([getFranchises(), getAgents()])
      .then(([franchiseResult, agentResult]) => {
        if (franchiseResult.status === "fulfilled") {
          setFranchises(franchiseResult.value);
        } else {
          showError(franchiseResult.reason instanceof Error ? franchiseResult.reason.message : "Erro ao carregar franquias.");
        }
        if (agentResult.status === "fulfilled") {
          setAgents(agentResult.value);
        } else {
          showError(agentResult.reason instanceof Error ? agentResult.reason.message : "Erro ao carregar agentes.");
        }
      });
  }, [showError, refreshKey]);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  const filteredFranchises = useMemo(() => {
    const list = isSuperAdmin
      ? franchises
      : franchises.filter((f) => f.id === user?.franchise?.id);

    if (!search.trim()) return list;

    const query = search.toLowerCase();
    return list.filter((f) =>
      f.name.toLowerCase().includes(query) ||
      f.city.toLowerCase().includes(query)
    );
  }, [franchises, isSuperAdmin, user, search, refreshKey]);

  // For ADMIN_FRANQUIA, only show franchises with agents
  const franchisesWithAgents = useMemo(() => {
    if (isSuperAdmin) return filteredFranchises;
    return filteredFranchises.filter((f) => f.agentId);
  }, [filteredFranchises, isSuperAdmin]);

  // For ADMIN_FRANQUIA, get the first franchise without agent for the "create" button
  const franchiseWithoutAgent = useMemo(() => {
    if (isSuperAdmin) return null;
    return filteredFranchises.find((f) => !f.agentId);
  }, [filteredFranchises, isSuperAdmin]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Agentes"
        title={isSuperAdmin ? "Franquias e agentes" : "Meu agente"}
        description={isSuperAdmin ? "Visualize e gerencie os agentes de cada franquia." : "Acompanhe o agente da sua franquia."}
      />

      {isSuperAdmin && franchises.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-primary)" }}>
          <Search size={17} style={{ color: "var(--color-text-tertiary)" }} />
          <input
            type="text"
            placeholder="Buscar franquia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>
      )}

      {isSuperAdmin ? (
        filteredFranchises.length ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {filteredFranchises.map((franchise) => {
              const agent = agents.find((item) => item.franchiseId === franchise.id);
              return (
                <FranchiseCard
                  key={franchise.id}
                  franchise={franchise}
                  agent={agent}
                  isSuperAdmin={isSuperAdmin}
                />
              );
            })}
          </section>
        ) : (
          <EmptyState
            icon={Bot}
            title={search ? "Nenhuma franquia encontrada" : "Nenhum agente encontrado"}
            description={search ? "Tente buscar com outros termos." : "Ainda nao ha dados para exibir."}
          />
        )
      ) : (
        franchisesWithAgents.length ? (
          <section className="space-y-3">
            {franchisesWithAgents.map((franchise) => {
              const agent = agents.find((item) => item.franchiseId === franchise.id);
              return (
                <AgentListItem
                  key={franchise.id}
                  franchise={franchise}
                  agent={agent}
                  onRefresh={handleRefresh}
                />
              );
            })}
          </section>
        ) : (
          <EmptyState
            icon={Bot}
            title="Nenhum assistente configurado"
            description="Crie seu primeiro assistente para comecar a atender seus clientes."
            action={franchiseWithoutAgent ? {
              label: "Criar meu assistente",
              href: `/franquias/${franchiseWithoutAgent.id}/agente/novo`
            } : undefined}
          />
        )
      )}
    </AppShell>
  );
}
