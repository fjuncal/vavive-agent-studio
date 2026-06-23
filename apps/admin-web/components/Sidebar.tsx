"use client";

import clsx from "clsx";
import {
  Bot,
  Building2,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  PlusCircle,
  Radio,
  Sparkles,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/franquias", label: "Franquias", icon: Building2 },
  { href: "/agentes", label: "Assistentes", icon: Bot },
  { href: "/canais", label: "Canais", icon: Radio },
  { href: "/conversas", label: "Conversas", icon: MessageSquareText },
  { href: "/leads", label: "Leads", icon: UsersRound }
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const baseNav = nav.map((item) => {
    if (user?.role === "ADMIN_FRANQUIA" && item.href === "/franquias") {
      return { ...item, label: "Minha franquia" };
    }
    if (user?.role === "ADMIN_FRANQUIA" && item.href === "/agentes") {
      return { ...item, label: "Meu assistente", icon: PlusCircle };
    }
    if (user?.role === "ADMIN_FRANQUIA" && item.href === "/conversas") {
      return { ...item, label: "Atendimentos" };
    }
    return item;
  });
  const visibleNav = user?.role === "SUPER_ADMIN"
    ? [...baseNav, { href: "/configuracoes/textos-padrao", label: "Padroes do assistente", icon: FileText }]
    : baseNav;

  return (
    <aside
      className={clsx(
        "flex flex-col px-5 py-5",
        "lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:border-r",
        "lg:backdrop-blur-2xl"
      )}
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-bg-primary)"
      }}
    >
      <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl px-2 py-2 group" onClick={onClose}>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white transition-transform duration-200 group-hover:scale-105 dark:bg-brand-600">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Vavive</p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Assistente Vavive</p>
        </div>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/") && item.href !== "/";
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              style={!active ? { color: "var(--color-text-secondary)" } : undefined}
            >
              <Icon size={18} className={active ? "text-brand-600 dark:text-brand-400" : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl bg-ink p-4 text-white relative overflow-hidden dark:bg-brand-900/30 dark:border dark:border-brand-800">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/12">
            <Bot size={18} />
          </div>
          <p className="text-sm font-semibold">Assistente Vavive</p>
          <p className="mt-1 text-xs leading-5 text-white/60">Organize blocos, treino e operacao da unidade.</p>
          <Link
            href="/agentes"
            onClick={onClose}
            className="mt-4 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-white/90 transition-colors dark:bg-brand-600 dark:text-white"
          >
            Ver assistentes
          </Link>
        </div>
      </div>
    </aside>
  );
}
