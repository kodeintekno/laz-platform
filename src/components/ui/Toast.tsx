"use client";

import { useToastStore, type ToastMessage } from "@/stores/toast.store";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-info-token" />,
  };

  const bgMap = {
    success: "bg-surface border-success/30 text-primary",
    error: "bg-surface border-destructive/30 text-primary",
    warning: "bg-surface border-warning/30 text-primary",
    info: "bg-surface border-info-token/30 text-primary",
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto transition-all duration-300 ${bgMap[toast.type]}`}
    >
      <div className="flex-shrink-0">{iconMap[toast.type]}</div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-muted hover:text-primary focus:outline-none cursor-pointer"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
