"use client";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-mist px-4">
        <div className="rounded-2xl border border-line/80 bg-white/86 px-6 py-5 text-sm text-slate-500 shadow-soft">
          Carregando sua sessao...
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
