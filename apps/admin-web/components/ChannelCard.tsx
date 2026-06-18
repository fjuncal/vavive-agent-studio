"use client";

import { Wifi, WifiOff, MessageCircle, MoreVertical, Trash2, Edit3, QrCode, Link2 } from "lucide-react";
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
  agentName?: string | null;
  username?: string | null;
  onConnect?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}

export function ChannelCard({
  name,
  type,
  connected,
  agentName,
  username,
  onConnect,
  onEdit,
  onRemove
}: ChannelCardProps) {
  const config = CHANNEL_CONFIG[type] || CHANNEL_CONFIG.UNKNOWN;

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

        {/* Status badge */}
        <div className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0",
          connected
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        )}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? "Conectado" : "Desconectado"}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        {!connected && onConnect && (
          <button
            type="button"
            onClick={onConnect}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <QrCode size={14} />
            Conectar
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <Edit3 size={14} />
            Editar
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="btn-ghost text-red-600 dark:text-red-400 flex items-center gap-2 text-sm ml-auto"
          >
            <Trash2 size={14} />
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
