import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, CircleAlert, Info, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type NotificationKind = "INFO" | "SUCCESS" | "WARNING" | "ACTION_REQUIRED";

interface NotificationItem {
  id: string;
  type: NotificationKind;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationPayload {
  items: NotificationItem[];
  unreadCount: number;
}

const kindStyles: Record<NotificationKind, string> = {
  INFO: "bg-blue-50 text-blue-600",
  SUCCESS: "bg-emerald-50 text-emerald-600",
  WARNING: "bg-amber-50 text-amber-600",
  ACTION_REQUIRED: "bg-rose-50 text-rose-600",
};

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return days < 7
    ? `${days} hari lalu`
    : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(value));
}

export function NotificationBell({ principal = "staff" }: { principal?: "staff" | "volunteer" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const endpoint = principal === "volunteer" ? "/volunteers/notifications" : "/notifications";
  const queryKey = ["notifications", principal];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => (await api.get<NotificationPayload>(endpoint)).data,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`${endpoint}/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const markAll = useMutation({
    mutationFn: () => api.patch(`${endpoint}/read-all`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const openItem = (item: NotificationItem) => {
    if (!item.readAt) markOne.mutate(item.id);
    setOpen(false);
    if (item.link?.startsWith("/")) navigate(item.link);
  };

  const unread = data?.unreadCount ?? 0;
  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 rounded-full text-muted hover:bg-surface-muted hover:text-primary transition-all cursor-pointer"
        aria-label={unread ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 h-4 px-1 rounded-full bg-error-token text-white text-[10px] leading-4 font-bold text-center ring-2 ring-surface">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-soft z-50">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50">
            <div>
              <p className="font-bold text-primary">Notifikasi</p>
              <p className="text-xs text-secondary">{unread ? `${unread} belum dibaca` : "Semua sudah dibaca"}</p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" /> Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-secondary"><LoaderCircle className="w-5 h-5 animate-spin" /></div>
            ) : isError ? (
              <div className="px-6 py-10 text-center">
                <CircleAlert className="w-8 h-8 mx-auto mb-2 text-error-token" />
                <p className="text-sm font-semibold text-primary">Notifikasi gagal dimuat</p>
                <button type="button" onClick={() => refetch()} className="mt-2 text-xs font-semibold text-brand-primary hover:underline">Coba lagi</button>
              </div>
            ) : !data?.items.length ? (
              <div className="px-6 py-10 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 text-muted" />
                <p className="text-sm font-semibold text-primary">Belum ada notifikasi</p>
                <p className="text-xs text-secondary mt-1">Pembaruan penting akan muncul di sini.</p>
              </div>
            ) : data.items.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => openItem(item)}
                className={cn(
                  "w-full flex gap-3 px-4 py-3 text-left border-b last:border-b-0 border-border/40 hover:bg-surface-muted transition-colors",
                  !item.readAt && "bg-brand-primary/[0.04]",
                )}
              >
                <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", kindStyles[item.type])}>
                  {item.type === "ACTION_REQUIRED" || item.type === "WARNING" ? <CircleAlert className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span className={cn("block flex-1 text-sm text-primary", !item.readAt && "font-bold")}>{item.title}</span>
                    {!item.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-primary" />}
                  </span>
                  <span className="block mt-0.5 text-xs leading-relaxed text-secondary line-clamp-2">{item.message}</span>
                  <span className="block mt-1 text-[11px] text-muted">{relativeTime(item.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
