"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

const styles = {
  success: "border-l-4 border-green-500 dark:border-green-400",
  error: "border-l-4 border-red-500 dark:border-red-400",
  info: "border-l-4 border-blue-500 dark:border-blue-400"
};

const iconStyles = {
  success: "text-green-500 dark:text-green-400",
  error: "text-red-500 dark:text-red-400",
  info: "text-blue-500 dark:text-blue-400"
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);

    if (type !== "error") {
      setTimeout(() => removeToast(id), 5000);
    }
  }, [removeToast]);

  const value: ToastContextValue = {
    toast: addToast,
    success: (message: string) => addToast("success", message),
    error: (message: string) => addToast("error", message),
    info: (message: string) => addToast("info", message)
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={`card flex items-start gap-3 p-4 shadow-lg animate-in ${styles[toast.type]}`}
              role="alert"
            >
              <Icon size={20} className={`shrink-0 ${iconStyles[toast.type]}`} />
              <p className="flex-1 text-sm" style={{ color: "var(--color-text-primary)" }}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Fechar"
              >
                <X size={16} style={{ color: "var(--color-text-tertiary)" }} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
