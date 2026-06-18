"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Drawer } from "@/components/Drawer";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen" style={{ background: "var(--color-bg-secondary)" }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-72">
        <Header onMenuClick={() => setIsDrawerOpen(true)} />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 animate-in">
          {children}
        </main>
      </div>
    </div>
  );
}
