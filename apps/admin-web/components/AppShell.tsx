"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Drawer } from "@/components/Drawer";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function AppShell({
  children,
  wide = false,
  fullHeight = false
}: {
  children: React.ReactNode;
  wide?: boolean;
  fullHeight?: boolean;
}) {
  const { isLoading, token } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center px-4" style={{ background: "var(--color-bg-secondary)" }}>
        <div className="card flex items-center gap-3 px-6 py-5">
          <Loader2 size={20} className="animate-spin text-brand-600" />
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando sua sessão...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div
      className={fullHeight ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"}
      style={{ background: "var(--color-bg-secondary)" }}
    >
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Main content */}
      <div className={fullHeight ? "flex h-full min-h-0 flex-col lg:pl-[15.5rem]" : "lg:pl-[15.5rem]"}>
        <Header onMenuClick={() => setIsDrawerOpen(true)} />
        <main className={`mx-auto flex w-full flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-6 ${fullHeight ? "min-h-0 flex-1 overflow-hidden" : "gap-5"} ${wide ? "max-w-[1800px]" : "max-w-[1480px]"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

