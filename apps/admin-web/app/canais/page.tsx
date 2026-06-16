"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { getFranchiseGptMakerConnection, getFranchises, type FranchiseSummary, type FranchiseGptMakerConnection } from "@/lib/api";
import { Bot, Building2, Radio, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

const CHANNELS = [
  { id: "webchat", label: "Webchat" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telegram", label: "Telegram" },
  { id: "messenger", label: "Facebook Messenger" },
  { id: "instagram", label: "Instagram" },
];

export default function CanaisPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [connections, setConnections] = useState<Record<string, FranchiseGptMakerConnection | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getFranchises()
      .then(async (items) => {
        setFranchises(items);
        const connMap: Record<string, FranchiseGptMakerConnection | null> = {};
        await Promise.allSettled(
          items.map(async (f) => {
            try {
              connMap[f.id] = await getFranchiseGptMakerConnection(f.id);
            } catch {
              connMap[f.id] = null;
            }
          })
        );
        setConnections(connMap);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar."))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleFranchises = isSuperAdmin
    ? franchises
    : franchises.filter((f) => f.id === user?.franchise?.id);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Canais"
        title="Canais de atendimento"
        description={isSuperAdmin ? "Canais disponíveis por franquia." : "Canais da sua franquia."}
      />
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {isLoading ? (
        <section className="rounded-2xl border border-line/80 bg-white/86 p-6 shadow-soft">
          <p className="text-sm text-slate-500">Carregando...</p>
        </section>
      ) : visibleFranchises.length ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {visibleFranchises.map((f) => {
            const conn = connections[f.id];
            const hasAgent = !!conn?.agentId;
            return (
              <article key={f.id} className="rounded-2xl border border-line/80 bg-white/86 p-5 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-ink">{f.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{f.city} / {f.state}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${hasAgent ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {hasAgent ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {hasAgent ? "Ativo" : "Inativo"}
                  </div>
                </div>

                {hasAgent ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {CHANNELS.map((ch) => (
                      <div key={ch.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                        <Radio size={16} className="text-brand-700" />
                        <span className="text-sm font-medium text-ink">{ch.label}</span>
                        <span className="ml-auto text-xs font-semibold text-emerald-600">Disponível</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                    Configure um agente primeiro para disponibilizar os canais.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState icon={Radio} title="Nenhum canal" description="Nenhum canal disponivel ainda." />
      )}
    </AppShell>
  );
}
