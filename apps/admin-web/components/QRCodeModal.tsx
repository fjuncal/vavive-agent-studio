"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  onConnected?: () => void;
  fetchQRCode: (channelId: string) => Promise<{ value?: string; connected?: boolean; message?: string | null }>;
}

export function QRCodeModal({
  isOpen,
  onClose,
  channelId,
  channelName,
  onConnected,
  fetchQRCode
}: QRCodeModalProps) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrImageSrc, setQrImageSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "qr" | "connected" | "error" | "timeout">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resolveQrImageSrc = useCallback(async (value: string) => {
    if (value.startsWith("data:")) {
      return value;
    }

    if (value.startsWith("<svg") || value.startsWith("<?xml")) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(value)}`;
    }

    const normalized = value.replace(/\s+/g, "");
    const looksLikeImageBase64 = /^[A-Za-z0-9+/=]+$/.test(normalized) && normalized.length > 256;
    if (looksLikeImageBase64) {
      return `data:image/png;base64,${normalized}`;
    }

    return QRCode.toDataURL(value, { width: 256, margin: 1 });
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    elapsedRef.current = 0;
    setQrData(null);
    setQrImageSrc(null);
    setErrorMessage("");
    setStatus("loading");

    const poll = async () => {
      try {
        const data = await fetchQRCode(channelId);

        if (data.connected) {
          setStatus("connected");
          stopPolling();
          onConnected?.();
          return;
        }

        if (data.message) {
          setStatus("error");
          setErrorMessage(data.message);
          stopPolling();
          return;
        }

        if (data.value) {
          setQrData(data.value);
          setQrImageSrc(await resolveQrImageSrc(data.value));
          setStatus("qr");
        }

        if (elapsedRef.current > 120) {
          setStatus("timeout");
          stopPolling();
          return;
        }

        elapsedRef.current += 3;
        const nextInterval = elapsedRef.current > 60 ? 10000 : elapsedRef.current > 30 ? 5000 : 3000;
        timeoutRef.current = setTimeout(() => {
          void poll();
        }, nextInterval);
      } catch {
        setStatus("error");
        setErrorMessage("Erro ao buscar QR code");
        stopPolling();
      }
    };

    void poll();
  }, [channelId, fetchQRCode, onConnected, resolveQrImageSrc, stopPolling]);

  useEffect(() => {
    if (isOpen) {
      startPolling();
    }
    return () => stopPolling();
  }, [isOpen, startPolling, stopPolling]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Conectar {channelName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} style={{ color: "var(--color-text-tertiary)" }} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={48} className="animate-spin text-brand-500" />
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Gerando QR code...
              </p>
            </div>
          )}

          {status === "qr" && qrData && qrImageSrc && (
            <>
              <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageSrc}
                  alt="QR Code para conexao"
                  width={256}
                  height={256}
                  className="block"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Escaneie o QR code com seu WhatsApp
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                  Aguardando conexao...
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                <Loader2 size={14} className="animate-spin" />
                Verificando conexao automaticamente
              </div>
            </>
          )}

          {status === "connected" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 size={48} className="text-green-500" />
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                Conectado!
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Canal conectado com sucesso
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle size={48} className="text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={startPolling}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Tentar novamente
              </button>
            </div>
          )}

          {status === "timeout" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle size={48} className="text-amber-500" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Tempo esgotado. O QR code pode ter expirado.
              </p>
              <button
                type="button"
                onClick={startPolling}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Gerar novo QR code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
