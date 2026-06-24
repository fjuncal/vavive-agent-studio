"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff, MoreVertical, Trash2, Edit3, QrCode, Link2, Settings2, Unplug } from "lucide-react";
import clsx from "clsx";

export type ChannelType = "Z_API" | "WHATSAPP" | "INSTAGRAM" | "CLOUD_API" | "TELEGRAM" | "WIDGET" | "MESSENGER" | "MERCADO_LIVRE" | "TWILIO_SMS";

const CHANNEL_CONFIG: Record<ChannelType | "UNKNOWN", { label: string; icon: string; color: string }> = {
  Z_API: { label: "WhatsApp (Z-API)", icon: "📱", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  WHATSAPP: { label: "WhatsApp", icon: "📱", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CLOUD_API: { label: "WhatsApp Cloud", icon: "☁️", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  INSTAGRAM: { label: "Instagram", icon: "📷", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  TELEGRAM: { label: "Telegram", icon: "✈️", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  WIDGET: { label: "Widget", icon: "🌐", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  MESSENGER: { label: "Messenger", icon: "💬", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  MERCADO_LIVRE: { label: "Mercado Livre", icon: "🛒", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  TWILIO_SMS: { label: "SMS (Twilio)", icon: "📨", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  UNKNOWN: { label: "Desconhecido", icon: "📡", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
};

interface ChannelCardProps {
  name: string;
  type: ChannelType;
  connected: boolean;
  lastSyncError?: string | null;
  configUpdatedAt?: string | null;
  agentName?: string | null;
  agentId?: string | null;
  username?: string | null;
  onConnect?: () => void;
  onEdit?: () => void;
  onSettings?: () => void;
  onDetachAgent?: () => void;
  onRemove?: () => void;
}

export function ChannelCard({
  name,
  type,
  connected,
  lastSyncError,
  configUpdatedAt,
  agentName,
  agentId,
  username,
  onConnect,
  onEdit,
  onSettings,
  onDetachAgent,
  onRemove
}: ChannelCardProps) {
  const config = CHANNEL_CONFIG[type] || CHANNEL_CONFIG.UNKNOWN;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {/* Type icon */}
          <div className={clsx("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl", config.color)}>
            {config.icon}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <h3 className="font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
              {name}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              {config.label}
            </p>
            {username && (
              <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-tertiary)" }}>
                {username}
              </p>
            )}
            {agentName && (
              <div className="flex items-center gap-1.5 mt-2">
                <Link2 size={12} className="text-brand-500" />
                <span className="text-xs text-brand-600 dark:text-brand-400">{agentName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0",
            connected
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? "Conectado" : "Desconectado"}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-11 z-10 w-52 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                {onConnect ? (
                  <MenuButton icon={QrCode} label="Conectar" onClick={() => { setMenuOpen(false); onConnect(); }} />
                ) : null}
                {onSettings ? (
                  <MenuButton icon={Settings2} label="Configuracoes" onClick={() => { setMenuOpen(false); onSettings(); }} />
                ) : null}
                {onEdit ? (
                  <MenuButton icon={Edit3} label="Editar" onClick={() => { setMenuOpen(false); onEdit(); }} />
                ) : null}
                {agentId && onDetachAgent ? (
                  <MenuButton icon={Unplug} label="Remover" onClick={() => { setMenuOpen(false); onDetachAgent(); }} />
                ) : null}
                {onRemove ? (
                  <MenuButton icon={Trash2} label="Excluir" danger onClick={() => { setMenuOpen(false); onRemove(); }} />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4 text-xs dark:border-gray-800" style={{ color: "var(--color-text-tertiary)" }}>
        {configUpdatedAt ? <p>Configuracao atualizada em {new Date(configUpdatedAt).toLocaleString("pt-BR")}</p> : null}
        {lastSyncError ? <p className="mt-1 text-amber-600 dark:text-amber-400">{lastSyncError}</p> : null}
      </div>
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  danger = false,
  onClick
}: {
  icon: typeof QrCode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-gray-100 dark:hover:bg-gray-800",
        danger ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-200"
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
