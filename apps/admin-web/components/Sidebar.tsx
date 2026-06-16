"use client";

import clsx from "clsx";
import {
  Bot,
  Building2,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Route,
  Sparkles,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/franquias", label: "Franquias", icon: Building2 },
  { href: "/agentes", label: "Agentes", icon: Bot },
  { href: "/conversas", label: "Conversas", icon: MessageSquareText },
  { href: "/leads", label: "Leads", icon: UsersRound },
  { href: "/setup-guiado", label: "Configuração do agente", icon: Route }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const baseNav = nav.map((item) => {
    if (user?.role === "ADMIN_FRANQUIA" && item.href === "/franquias") {
      return { ...item, label: "Minha franquia" };
    }
    if (user?.role === "ADMIN_FRANQUIA" && item.href === "/agentes") {
      return { ...item, label: "Meu agente" };
    }
    if (user?.role === "ADMIN_FRANQUIA" && item.href === "/conversas") {
      return { ...item, label: "Atendimentos" };
    }
    if (user?.role === "ADMIN_FRANQUIA" && item.href === "/setup-guiado") {
      return { ...item, label: "Meu setup" };
    }
    return item;
  });
  const visibleNav = user?.role === "SUPER_ADMIN"
    ? [...baseNav, { href: "/configuracoes/textos-padrao", label: "Textos padrão", icon: FileText }]
    : baseNav;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-line/80 bg-white/78 px-5 py-5 shadow-soft backdrop-blur-xl lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl px-2 py-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-ink">Vavive</p>
          <p className="text-xs text-slate-500">Agent Studio</p>
        </div>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px_rgba(34,165,135,0.18)]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-ink"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl bg-ink p-4 text-white">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/12">
          <Route size={18} />
        </div>
        <p className="text-sm font-semibold">Configuração do agente</p>
        <p className="mt-1 text-xs leading-5 text-white/68">Complete os dados da franquia para gerar o treinamento do agente.</p>
        <Link href="/setup-guiado" className="mt-4 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-ink">
          Continuar
        </Link>
      </div>
    </aside>
  );
}
