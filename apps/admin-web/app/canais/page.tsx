"use client";

import { AppShell } from "@/components/AppShell";
import { ChannelCard, type ChannelType } from "@/components/ChannelCard";
import { ChannelConfigModal } from "@/components/ChannelConfigModal";
import { ChannelEditModal } from "@/components/ChannelEditModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/FormSection";
import { PageHeader } from "@/components/PageHeader";
import { QRCodeModal } from "@/components/QRCodeModal";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth";
import {
  getChannelStandardConfig,
  createFranchiseChannel,
  deleteFranchiseChannel,
  getChannelQRCode,
  getFranchiseChannelConfig,
  getFranchiseChannels,
  getFranchises,
  syncFranchiseChannels,
  updateChannelStandardConfig,
  updateFranchiseChannel,
  updateFranchiseChannelConfig,
  type FranchiseChannel,
  type FranchiseSummary
} from "@/lib/api";
import { Loader2, Plus, Radio, RefreshCw, Settings2, X } from "lucide-react";
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

const whatsappChannelType = channelTypes[0];

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
  const [isCreating, setIsCreating] = useState(false);
  const [qrChannel, setQrChannel] = useState<FranchiseChannel | null>(null);
  const [deleteChannel, setDeleteChannel] = useState<FranchiseChannel | null>(null);
  const [editChannel, setEditChannel] = useState<FranchiseChannel | null>(null);
  const [configChannel, setConfigChannel] = useState<FranchiseChannel | null>(null);
  const [channelConfigPayload, setChannelConfigPayload] = useState<Record<string, unknown> | null>(null);
  const [standardConfigPayload, setStandardConfigPayload] = useState<Record<string, unknown> | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isStandardConfigOpen, setIsStandardConfigOpen] = useState(false);
  const [isStandardConfigLoading, setIsStandardConfigLoading] = useState(false);
  const [isStandardConfigSaving, setIsStandardConfigSaving] = useState(false);

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
          return;
        }
        setChannels([]);
        setIsLoading(false);
      })
      .catch((requestError) => {
        setChannels([]);
        setIsLoading(false);
        showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar franquias.");
      });
  }, [showError, user]);

  useEffect(() => {
    if (!selectedFranchiseId) {
      setChannels([]);
      setIsLoading(false);
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
      const createdChannel = await createFranchiseChannel(selectedFranchiseId, channelName.trim(), "WHATSAPP");
      setChannels((current) => [...current, createdChannel].sort((left, right) => left.name.localeCompare(right.name)));
      setIsCreateModalOpen(false);
      setQrChannel(createdChannel);
      setChannelName("");
      showSuccess("Canal WhatsApp criado com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar o canal.");
    } finally {
      setIsCreating(false);
    }
  }, [channelName, selectedFranchiseId, showError, showSuccess]);

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

  const handleEdit = useCallback(async (name: string) => {
    if (!selectedFranchiseId || !editChannel || !name.trim()) {
      return;
    }
    setIsEditSaving(true);
    try {
      const updated = await updateFranchiseChannel(selectedFranchiseId, editChannel.id, { name: name.trim() });
      setChannels((current) => current.map((channel) => channel.id === updated.id ? updated : channel));
      setEditChannel(null);
      showSuccess("Canal atualizado com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel editar o canal.");
    } finally {
      setIsEditSaving(false);
    }
  }, [editChannel, selectedFranchiseId, showError, showSuccess]);

  const openChannelConfig = useCallback(async (channel: FranchiseChannel) => {
    if (!selectedFranchiseId) {
      return;
    }
    setConfigChannel(channel);
    setIsConfigLoading(true);
    try {
      const response = await getFranchiseChannelConfig(selectedFranchiseId, channel.id);
      setChannelConfigPayload(response.payload);
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar configuracoes do canal.");
      setConfigChannel(null);
    } finally {
      setIsConfigLoading(false);
    }
  }, [selectedFranchiseId, showError]);

  const handleSaveChannelConfig = useCallback(async (payload: Record<string, unknown>) => {
    if (!selectedFranchiseId || !configChannel) {
      return;
    }
    setIsConfigSaving(true);
    try {
      await updateFranchiseChannelConfig(selectedFranchiseId, configChannel.id, payload);
      setChannels((current) => current.map((channel) => (
        channel.id === configChannel.id ? { ...channel, configUpdatedAt: new Date().toISOString(), lastSyncError: null } : channel
      )));
      setConfigChannel(null);
      setChannelConfigPayload(null);
      showSuccess("Configuracoes do canal salvas com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar configuracoes do canal.");
    } finally {
      setIsConfigSaving(false);
    }
  }, [configChannel, selectedFranchiseId, showError, showSuccess]);

  const openStandardConfig = useCallback(async () => {
    setIsStandardConfigOpen(true);
    setIsStandardConfigLoading(true);
    try {
      const response = await getChannelStandardConfig("WHATSAPP");
      setStandardConfigPayload(response.payload);
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar o padrao do canal.");
      setIsStandardConfigOpen(false);
    } finally {
      setIsStandardConfigLoading(false);
    }
  }, [showError]);

  const handleSaveStandardConfig = useCallback(async (payload: Record<string, unknown>) => {
    setIsStandardConfigSaving(true);
    try {
      const response = await updateChannelStandardConfig("WHATSAPP", payload);
      setStandardConfigPayload(response.payload);
      setIsStandardConfigOpen(false);
      showSuccess("Padrao global do canal salvo com sucesso.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel salvar o padrao do canal.");
    } finally {
      setIsStandardConfigSaving(false);
    }
  }, [showError, showSuccess]);

  const handleDetachAgent = useCallback(async (channel: FranchiseChannel) => {
    if (!selectedFranchiseId) {
      return;
    }
    try {
      const updated = await updateFranchiseChannel(selectedFranchiseId, channel.id, { agentId: "" });
      setChannels((current) => current.map((item) => item.id === updated.id ? updated : item));
      showSuccess("Vinculo do agente removido do canal.");
    } catch (requestError) {
      showError(requestError instanceof Error ? requestError.message : "Nao foi possivel remover o vinculo do agente.");
    }
  }, [selectedFranchiseId, showError, showSuccess]);

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
            {isSuperAdmin ? (
              <button type="button" onClick={openStandardConfig} className="btn-secondary">
                <Settings2 size={16} />
                Padrao do canal
              </button>
            ) : null}
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

      {!selectedFranchiseId ? (
        <EmptyState
          icon={Radio}
          title={franchises.length === 0 ? "Nenhuma franquia encontrada" : "Nenhum canal cadastrado"}
          description={franchises.length === 0
            ? (isSuperAdmin
              ? "Nenhuma franquia esta disponivel para gerenciar canais."
              : "Sua conta ainda nao possui uma franquia vinculada.")
            : "Nao ha canais cadastrados para a franquia selecionada."}
        />
      ) : isLoading ? (
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
              lastSyncError={channel.lastSyncError}
              configUpdatedAt={channel.configUpdatedAt}
              agentId={channel.agentId}
              agentName={channel.agentName}
              username={channel.externalUsername}
              onConnect={channel.externalChannelId ? () => setQrChannel(channel) : undefined}
              onEdit={() => setEditChannel(channel)}
              onSettings={() => openChannelConfig(channel)}
              onDetachAgent={channel.agentId ? () => handleDetachAgent(channel) : undefined}
              onRemove={() => setDeleteChannel(channel)}
            />
          ))}
        </section>
      ) : (
        <EmptyState icon={Radio} title="Nenhum canal cadastrado" description="Crie um novo canal para comecar." />
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
              <div className="space-y-3">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Tipo do canal</span>
                <div className="card border-brand-200 bg-brand-50/70 p-4 dark:border-brand-800 dark:bg-brand-900/20">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-sm font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {whatsappChannelType.icon}
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{whatsappChannelType.label}</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Canal inicial do MVP. Depois da criacao, o QR code abre automaticamente para conectar o WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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

      <ChannelEditModal
        isOpen={!!editChannel}
        name={editChannel?.name ?? ""}
        isSaving={isEditSaving}
        onClose={() => setEditChannel(null)}
        onSave={handleEdit}
      />

      <ChannelConfigModal
        isOpen={!!configChannel}
        title={configChannel ? `Configuracoes do canal: ${configChannel.name}` : "Configuracoes do canal"}
        subtitle="Essas configuracoes sao aplicadas ao canal conectado da franquia."
        initialPayload={channelConfigPayload}
        isLoading={isConfigLoading}
        isSaving={isConfigSaving}
        onClose={() => {
          setConfigChannel(null);
          setChannelConfigPayload(null);
        }}
        onSave={handleSaveChannelConfig}
      />

      <ChannelConfigModal
        isOpen={isStandardConfigOpen}
        title="Padrao global do canal WhatsApp"
        subtitle="O que for salvo aqui sera usado como base quando uma franquia criar um novo canal."
        initialPayload={standardConfigPayload}
        isLoading={isStandardConfigLoading}
        isSaving={isStandardConfigSaving}
        onClose={() => {
          setIsStandardConfigOpen(false);
          setStandardConfigPayload(null);
        }}
        onSave={handleSaveStandardConfig}
      />
    </AppShell>
  );
}
