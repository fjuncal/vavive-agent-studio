"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { createFranchiseChannel, getFranchiseChannels, getFranchises, syncFranchiseChannels, type FranchiseChannel, type FranchiseSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Loader2, Plus, Radio, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function CanaisPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [channels, setChannels] = useState<FranchiseChannel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("WEBCHAT");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    getFranchises()
      .then((items) => {
        setFranchises(items);
        const defaultFranchise = user.role === "ADMIN_FRANQUIA" ? user.franchise?.id : items[0]?.id;
        if (defaultFranchise) {
          setSelectedFranchiseId((current) => current || defaultFranchise);
        }
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar franquias."));
  }, [user]);

  useEffect(() => {
    if (!selectedFranchiseId) {
      return;
    }
    setIsLoading(true);
    setError(null);
    getFranchiseChannels(selectedFranchiseId)
      .then(setChannels)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar canais."))
      .finally(() => setIsLoading(false));
  }, [selectedFranchiseId]);

  async function handleSync() {
    if (!selectedFranchiseId) {
      return;
    }
    setIsSyncing(true);
    setError(null);
    try {
      setChannels(await syncFranchiseChannels(selectedFranchiseId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel sincronizar canais.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleCreate() {
    if (!selectedFranchiseId || !channelName.trim()) {
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createFranchiseChannel(selectedFranchiseId, channelName.trim(), channelType);
      setChannels(await getFranchiseChannels(selectedFranchiseId));
      setIsModalOpen(false);
      setChannelName("");
      setChannelType("WEBCHAT");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar canal.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Canais"
        title="Canais reais por franquia"
        description={isSuperAdmin ? "Sincronizacao de canais por workspace GPTMaker." : "Status dos canais conectados da sua franquia."}
      />

      {error ? <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}

      <section className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <label className="grid gap-1.5 md:min-w-[280px]">
            <span className="text-sm font-medium text-slate-700">Franquia</span>
            <select
              className="input-field"
              value={selectedFranchiseId}
              onChange={(event) => setSelectedFranchiseId(event.target.value)}
              disabled={user?.role === "ADMIN_FRANQUIA"}
            >
              {franchises.map((franchise) => (
                <option key={franchise.id} value={franchise.id}>
                  {franchise.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={!selectedFranchiseId}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <Plus size={16} />
              Criar canal
            </button>

            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={!selectedFranchiseId || isSyncing}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Sincronizar canais
            </button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="card p-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Carregando canais...</p>
        </section>
      ) : channels.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {channels.map((channel) => (
            <article key={channel.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">{channel.channelType}</p>
                  <h2 className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{channel.name}</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{channel.agentName ?? "Sem agente vinculado"}</p>
                </div>
                <StatusBadge status={channel.connected ? "CONECTADO" : "DESCONECTADO"} />
              </div>
              <div className="mt-4 grid gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <p>Identificador: <strong style={{ color: "var(--color-text-primary)" }}>{channel.externalUsername ?? "Nao informado"}</strong></p>
                <p>Ultimo sync: <strong style={{ color: "var(--color-text-primary)" }}>{channel.lastSyncedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(channel.lastSyncedAt)) : "Ainda nao sincronizado"}</strong></p>
              </div>
              {channel.lastSyncError ? (
                <p className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">{channel.lastSyncError}</p>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <EmptyState icon={Radio} title="Nenhum canal sincronizado" description="Sem canais reais retornados pela API para esta franquia." />
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Criar canal</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>

            <form
              className="mt-5 grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleCreate();
              }}
            >
              <label className="grid gap-1.5">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Nome do canal</span>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Ex: Atendimento WhatsApp"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  required
                  autoFocus
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Tipo do canal</span>
                <select
                  className="input-field"
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value)}
                >
                  <option value="WEBCHAT">Webchat</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="TELEGRAM">Telegram</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="INSTAGRAM">Instagram</option>
                </select>
              </label>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!channelName.trim() || isCreating}
                  className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : null}
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
