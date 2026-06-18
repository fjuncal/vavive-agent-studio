"use client";

import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import { Bell, LogOut, Search, Menu, Sun, Moon } from "lucide-react";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "VV";

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-2xl"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--glass-bg)"
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Abrir menu"
        >
          <Menu size={20} style={{ color: "var(--color-text-primary)" }} />
        </button>

        {/* Search */}
        <div
          className="hidden min-w-0 flex-1 items-center gap-3 rounded-xl border px-3.5 py-2 text-sm shadow-sm sm:flex hover:shadow-md transition-all duration-200 cursor-pointer"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-bg-primary)",
            color: "var(--color-text-tertiary)"
          }}
        >
          <Search size={17} />
          <span>Buscar lead, franquia ou agente...</span>
          <kbd
            className="ml-auto hidden rounded-lg border px-2 py-0.5 text-2xs font-medium lg:block"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg-tertiary)",
              color: "var(--color-text-tertiary)"
            }}
          >
            ⌘K
          </kbd>
        </div>

        <div className="flex flex-1 items-center justify-between gap-3 sm:flex-none sm:justify-end">
          {/* Mobile title */}
          <div className="lg:hidden">
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Vavive Agent Studio</p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Gestão</p>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:shadow-sm"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg-primary)",
              color: "var(--color-text-secondary)"
            }}
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notifications */}
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md sm:flex"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg-primary)",
              color: "var(--color-text-secondary)"
            }}
            aria-label="Notificações"
          >
            <Bell size={17} />
          </button>

          {/* User menu */}
          <div
            className="flex items-center gap-3 rounded-xl border py-1 pl-1 pr-2 shadow-sm"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg-primary)"
            }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
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
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
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
