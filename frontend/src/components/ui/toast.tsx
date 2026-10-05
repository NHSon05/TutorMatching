"use client";

import * as React from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type?: ToastType;
  title?: React.ReactNode;
  description?: React.ReactNode;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, "id">) => string;
  removeToast: (id: string) => void;
  success: (title: React.ReactNode, description?: React.ReactNode) => string;
  error: (title: React.ReactNode, description?: React.ReactNode) => string;
  warning: (title: React.ReactNode, description?: React.ReactNode) => string;
  info: (title: React.ReactNode, description?: React.ReactNode) => string;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, ...toast };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const success = React.useCallback(
    (title: React.ReactNode, description?: React.ReactNode) =>
      showToast({ type: "success", title, description }),
    [showToast]
  );

  const error = React.useCallback(
    (title: React.ReactNode, description?: React.ReactNode) =>
      showToast({ type: "error", title, description }),
    [showToast]
  );

  const warning = React.useCallback(
    (title: React.ReactNode, description?: React.ReactNode) =>
      showToast({ type: "warning", title, description }),
    [showToast]
  );

  const info = React.useCallback(
    (title: React.ReactNode, description?: React.ReactNode) =>
      showToast({ type: "info", title, description }),
    [showToast]
  );

  const contextValue = React.useMemo(
    () => ({ showToast, removeToast, success, error, warning, info }),
    [showToast, removeToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Container Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: () => void;
}) {
  const type = toast.type || "info";

  const config = {
    success: {
      border: "border-emerald-200 dark:border-emerald-800",
      iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    error: {
      border: "border-red-200 dark:border-red-800",
      iconBg: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    warning: {
      border: "border-amber-200 dark:border-amber-800",
      iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    info: {
      border: "border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
  }[type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white dark:bg-gray-900 border rounded-2xl shadow-xl transition-all duration-200 animate-in slide-in-from-bottom-2 ${config.border}`}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.iconBg}`}>
        {config.icon}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
            {toast.title}
          </h4>
        )}
        {toast.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {toast.description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng thông báo"
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors cursor-pointer shrink-0"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default ToastProvider;
