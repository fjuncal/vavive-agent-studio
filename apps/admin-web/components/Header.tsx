"use client";

import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import { LogOut, Menu, Sun, Moon } from "lucide-react";
import { usePathname } from "next/navigation";
import { WorkspaceCreditsPill } from "@/components/WorkspaceCreditsPill";

const routeLabels: Record<string, string> = {
  dashboard: "Visão geral",
  conversas: "Central de atendimento",
  franquias: "Gestão de franquias",
  agentes: "Assistentes",
  canais: "Canais",
  contatos: "Contatos",
  leads: "Leads",
  "notificacoes-whatsapp": "Notificações WhatsApp",
  configuracoes: "Configurações"
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const pathname = usePathname();
  const routeLabel = routeLabels[pathname.split("/").filter(Boolean)[0] ?? "dashboard"] ?? "Vavive Agent Studio";
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "VV";

  return (
    <header
      className="sticky top-0 z-30 shrink-0 border-b bg-bg-primary"
      style={{
        borderColor: "var(--color-border)"
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1800px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-bg-tertiary lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} style={{ color: "var(--color-text-primary)" }} />
        </button>

        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="truncate text-sm font-semibold text-text-primary">{routeLabel}</p>
          <p className="truncate text-2xs text-text-tertiary">{user?.franchise?.name ?? "Administração da rede"}</p>
        </div>

        <div className="flex flex-1 items-center justify-between gap-3 sm:flex-none sm:justify-end">
          <div className="min-w-0 flex-1 sm:hidden">
            <p className="truncate text-sm font-semibold text-text-primary">{routeLabel}</p>
          </div>

          <WorkspaceCreditsPill />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors duration-150 hover:bg-bg-tertiary"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg-primary)",
              color: "var(--color-text-secondary)"
            }}
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1"
            style={{
              background: "var(--color-bg-tertiary)"
            }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {user?.name ?? "Carregando..."}
              </p>
              <p className="text-2xs" style={{ color: "var(--color-text-secondary)" }}>
                {user?.franchise?.name ?? user?.email ?? "Sem franquia vinculada"}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
              style={{ color: "var(--color-text-tertiary)" }}
              aria-label="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
