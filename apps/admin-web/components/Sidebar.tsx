"use client";

import clsx from "clsx";
import {
  Building2,
  FileText,
  LayoutDashboard,
  MessageCircleMore,
  MessageSquareText,
  PlusCircle,
  Radio,
  Sparkles,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { LucideIcon } from "lucide-react";

type NavGroup = "Visão geral" | "Operação" | "Gestão";
type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: NavGroup;
  franchiseOnly?: boolean;
  superAdminOnly?: boolean;
};

const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Visão geral" },
  { href: "/conversas", label: "Conversas", icon: MessageSquareText, group: "Operação" },
  { href: "/leads", label: "Leads", icon: UsersRound, group: "Operação" },
  { href: "/contatos", label: "Contatos", icon: UsersRound, group: "Operação", franchiseOnly: true },
  { href: "/franquias", label: "Franquias", icon: Building2, group: "Gestão" },
  { href: "/agentes", label: "Assistentes", icon: Sparkles, group: "Gestão" },
  { href: "/canais", label: "Canais", icon: Radio, group: "Gestão" },
  { href: "/notificacoes-whatsapp", label: "Notificações WhatsApp", icon: MessageCircleMore, group: "Gestão", superAdminOnly: true }
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const baseNav = nav.filter((item) => {
    if (item.franchiseOnly && user?.role !== "ADMIN_FRANQUIA") return false;
    if (item.superAdminOnly && user?.role !== "SUPER_ADMIN") return false;
    return true;
  }).map((item) => {
    if (user?.role === "ADMIN_FRANQUIA" && item.href === "/franquias") return { ...item, label: "Minha franquia" };
    if (user?.role === "ADMIN_FRANQUIA" && item.href === "/agentes") return { ...item, label: "Meu assistente", icon: PlusCircle };
    if (user?.role === "ADMIN_FRANQUIA" && item.href === "/conversas") return { ...item, label: "Atendimentos" };
    return item;
  });
  const visibleNav: NavItem[] = user?.role === "SUPER_ADMIN"
    ? [...baseNav, { href: "/configuracoes/textos-padrao", label: "Padrões do assistente", icon: FileText, group: "Gestão" }]
    : baseNav;
  const groups = (["Visão geral", "Operação", "Gestão"] as const)
    .map((label) => ({ label, items: visibleNav.filter((item) => item.group === label) }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="flex h-full flex-col bg-[#102b2a] px-3 py-4 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-[15.5rem]">
      <Link href="/dashboard" className="group flex items-center gap-3 rounded-xl px-2 py-2.5" onClick={onClose}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#26a886] text-white shadow-sm transition-colors group-hover:bg-[#30b994]">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">Vavive</p>
          <p className="text-2xs text-white/55">Agent Studio</p>
        </div>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-5 overflow-y-auto px-1 scrollbar-thin" aria-label="Navegação principal">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">{group.label}</p>
            <div className="grid gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={clsx(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-white/[0.11] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {active ? <span className="absolute -left-1 h-5 w-0.5 rounded-r bg-[#39c59f]" aria-hidden="true" /> : null}
                    <Icon size={17} className={active ? "text-[#5fd5b5]" : "text-white/45"} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mx-1 border-t border-white/10 px-3 pt-4">
        <p className="truncate text-xs font-medium text-white/75">{user?.franchise?.name ?? "Rede Vavive"}</p>
        <p className="mt-0.5 text-2xs text-white/40">{user?.role === "SUPER_ADMIN" ? "Administração da rede" : "Operação da unidade"}</p>
      </div>
    </aside>
  );
}
