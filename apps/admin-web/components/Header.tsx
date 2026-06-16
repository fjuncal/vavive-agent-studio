"use client";

import { useAuth } from "@/lib/auth";
import { Bell, LogOut, Search } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "VV";

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-white/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-500 shadow-sm sm:flex">
          <Search size={17} />
          <span>Buscar lead, franquia ou agente</span>
        </div>
        <div className="flex flex-1 items-center justify-between gap-3 sm:flex-none sm:justify-end">
          <div className="lg:hidden">
            <p className="text-sm font-semibold text-ink">Vavive Agent Studio</p>
            <p className="text-xs text-slate-500">Gestão</p>
          </div>
          <button className="hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-slate-600 shadow-sm sm:flex" aria-label="Notificações">
            <Bell size={17} />
          </button>
          <div className="flex items-center gap-3 rounded-full border border-line bg-white py-1 pl-1 pr-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{initials}</div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-ink">{user?.name ?? "Carregando..."}</p>
              <p className="text-[11px] text-slate-500">
                {user?.franchise?.name ?? user?.email ?? "Sem franquia vinculada"}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-ink"
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
