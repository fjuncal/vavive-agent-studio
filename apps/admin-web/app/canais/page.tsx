"use client";

import { AppShell } from "@/components/AppShell";
import { ChannelCard, type ChannelType } from "@/components/ChannelCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/FormSection";
import { OptionCards } from "@/components/FriendlyForm";
import { PageHeader } from "@/components/PageHeader";
import { QRCodeModal } from "@/components/QRCodeModal";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth";
import {
  createFranchiseChannel,
  deleteFranchiseChannel,
  getChannelQRCode,
  getFranchiseChannels,
  getFranchises,
  syncFranchiseChannels,
  type FranchiseChannel,
  type FranchiseSummary
} from "@/lib/api";
import { Loader2, Plus, Radio, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const channelTypes = [
  { value: "WHATSAPP", label: "WhatsApp", description: "Conectar via QR code", icon: "WA" },
  { value: "Z_API", label: "WhatsApp (Z-API)", description: "Z-API provider", icon: "ZA" },
  { value: "CLOUD_API", label: "WhatsApp Cloud", description: "Cloud API oficial", icon: "WC" },
  { value: "TELEGRAM", label: "Telegram", description: "Bot do Telegram", icon: "TG" },
  { value: "INSTAGRAM", label: "Instagram", description: "Direct do Instagram", icon: "IG" },
  { value: "WIDGET", label: "Widget", description: "Widget para site", icon: "WD" },
  { value: "MESSENGER", label: "Messenger", description: "Facebook Messenger", icon: "MS" },
  { value: "MERCADO_LIVRE", label: "Mercado Livre", description: "Chat do ML", icon: "ML" },
  { value: "TWILIO_SMS", label: "SMS (Twilio)", description: "SMS via Twilio", icon: "SMS" }
];

export default function CanaisPage() {
  const { user } = useAuth();
  const { error: showError, success: showSuccess, info: showInfo } = useToast();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [channels, setChannels] = useState<FranchiseChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("WHATSAPP");
  const [isCreating, setIsCreating] = useState(false);
  const [qrChannel, setQrChannel] = useState<FranchiseChannel | null>(null);
  const [deleteChannel, setDeleteChannel] = useState<FranchiseChannel | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    getFranchises()
      .then((items) => {
        setFranchises(items);
        const defaultFranchiseId = user.role === "ADMIN_FRANQUIA" ? user.franchise?.id : items[0]?.id;
        if (defaultFranchiseId) {
          setSelectedFranchiseId((current) => current || defaultFranchiseId);
        }
      })
      .catch((requestError) => showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar franquias."));
  }, [showError, user]);

  useEffect(() => {
    if (!selectedFranchiseId) {
      return;
    }
    setIsLoading(true);
    getFranchiseChannels(selectedFranchiseId)
      .then(setChannels)
      .catch((requestError) => showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar canais."))
      .finally(() => setIsLoading(false));
  }, [selectedFranchiseId, showError]);

  const handleSync = useCallback(async () => {
    if (!selectedFranchiseId) {
      return;
    }
    setIsSyncing(true);
    try {
      setChannels(await syncFranchiseChannels(selectedFranchiseId));
      showSuccess("Canais sincronizados com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel sincronizar canais.");
    } finally {
      setIsSyncing(false);
    }
  }, [selectedFranchiseId, showError, showSuccess]);

  const handleCreate = useCallback(async () => {
    if (!selectedFranchiseId || !channelName.trim()) {
      return;
    }
    setIsCreating(true);
    try {
      await createFranchiseChannel(selectedFranchiseId, channelName.trim(), channelType);
      setChannels(await getFranchiseChannels(selectedFranchiseId));
      setIsCreateModalOpen(false);
      setChannelName("");
      setChannelType("WHATSAPP");
      showSuccess("Canal criado com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar o canal.");
    } finally {
      setIsCreating(false);
    }
  }, [channelName, channelType, selectedFranchiseId, showError, showSuccess]);

  const handleDelete = useCallback(async () => {
    if (!selectedFranchiseId || !deleteChannel) {
      return;
    }
    try {
      await deleteFranchiseChannel(selectedFranchiseId, deleteChannel.id);
      setChannels((current) => current.filter((channel) => channel.id !== deleteChannel.id));
      setDeleteChannel(null);
      showSuccess("Canal removido com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel remover o canal.");
    }
  }, [deleteChannel, selectedFranchiseId, showError, showSuccess]);

  const fetchQRCode = useCallback(async (channelId: string) => {
    if (!selectedFranchiseId) {
      throw new Error("Franquia nao selecionada.");
    }
    return getChannelQRCode(selectedFranchiseId, channelId);
  }, [selectedFranchiseId]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Canais"
        title="Canais"
        description={isSuperAdmin ? "Gerencie canais por franquia." : "Canais conectados da sua franquia."}
      />

      <section className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <label className="grid gap-1.5 md:min-w-[280px]">
            <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Franquia</span>
            <select className="input-field" value={selectedFranchiseId} onChange={(event) => setSelectedFranchiseId(event.target.value)} disabled={user?.role === "ADMIN_FRANQUIA"}>
              {franchises.map((franchise) => (
                <option key={franchise.id} value={franchise.id}>{franchise.name}</option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={() => setIsCreateModalOpen(true)} disabled={!selectedFranchiseId} className="btn-primary">
              <Plus size={16} />
              Novo canal
            </button>
            <button type="button" onClick={handleSync} disabled={!selectedFranchiseId || isSyncing} className="btn-secondary">
              {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Sincronizar
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
            <ChannelCard
              key={channel.id}
              name={channel.name}
              type={(channelTypes.some((item) => item.value === channel.channelType) ? channel.channelType : "WIDGET") as ChannelType}
              connected={channel.connected}
              agentName={channel.agentName}
              username={channel.externalUsername}
              onConnect={channel.externalChannelId ? () => setQrChannel(channel) : undefined}
              onEdit={undefined}
              onRemove={() => setDeleteChannel(channel)}
            />
          ))}
        </section>
      ) : (
        <EmptyState icon={Radio} title="Nenhum canal" description="Crie um novo canal para comecar." />
      )}

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Novo canal</h2>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={18} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>

            <div className="space-y-5">
              <Field label="Nome do canal" placeholder="Ex: Atendimento WhatsApp" value={channelName} onChange={setChannelName} required />
              <OptionCards label="Tipo do canal" value={channelType} onChange={setChannelType} options={channelTypes} />

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="button" onClick={handleCreate} disabled={!channelName.trim() || isCreating} className="btn-primary">
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : null}
                  Criar canal
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {qrChannel ? (
        <QRCodeModal
          isOpen={!!qrChannel}
          onClose={() => setQrChannel(null)}
          channelId={qrChannel.id}
          channelName={qrChannel.name}
          fetchQRCode={fetchQRCode}
          onConnected={() => {
            setChannels((current) => current.map((channel) => (channel.id === qrChannel.id ? { ...channel, connected: true } : channel)));
            showInfo("Canal conectado. Atualize a lista se quiser confirmar o estado remoto.");
          }}
        />
      ) : null}

      <ConfirmDialog
        isOpen={!!deleteChannel}
        title="Remover canal"
        description={`Tem certeza que deseja remover o canal "${deleteChannel?.name}"?`}
        confirmLabel="Remover"
        onCancel={() => setDeleteChannel(null)}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
