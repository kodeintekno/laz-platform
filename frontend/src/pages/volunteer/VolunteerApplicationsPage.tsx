import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-client";
import { Badge, EmptyState } from "@/components/ui";
import { CheckCircle2, Clock, XCircle, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

// ─── Status metadata ─────────────────────────────────────────────────────────
const STATUS_META: Record<
  string,
  { label: string; intent: "success" | "warning" | "destructive"; icon: React.ReactNode }
> = {
  PENDING:          { label: "Menunggu Persetujuan",       intent: "warning",     icon: <Clock className="w-3.5 h-3.5" /> },
  REJECTED:         { label: "Ditolak",                    intent: "destructive", icon: <XCircle className="w-3.5 h-3.5" /> },
  APPROVED:         { label: "Disetujui – Sedang Diikuti", intent: "success",     icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REPORT_SUBMITTED: { label: "Laporan Dikirim",            intent: "warning",     icon: <ClipboardList className="w-3.5 h-3.5" /> },
  COMPLETED:        { label: "Selesai & Terverifikasi",    intent: "success",     icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const fmtDate = (d?: string | null) =>
  d ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d)) : "-";

// ─── Single Application Card ─────────────────────────────────────────────────
function AppCard({ app }: { app: any }) {
  const meta = STATUS_META[app.status] ?? { label: app.status, intent: "warning" as const, icon: null };

  return (
    <div className="bg-surface rounded-2xl border border-border/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-primary leading-tight">{app.activity?.title}</p>
          <p className="text-xs text-secondary mt-0.5">
            {app.lembaga?.name}
            {app.activity?.location ? ` · ${app.activity.location}` : ""}
          </p>
          {app.activity?.activityDate && (
            <p className="text-xs text-secondary mt-0.5">🗓️ {fmtDate(app.activity.activityDate)}</p>
          )}
          <p className="text-xs text-muted mt-1">Didaftarkan {fmtDate(app.createdAt)}</p>
          {app.status === "REJECTED" && app.rejectionReason && (
            <p className="text-xs text-destructive mt-1.5 bg-destructive/5 px-2 py-1 rounded-lg">
              Alasan: {app.rejectionReason}
            </p>
          )}
          {app.status === "COMPLETED" && app.reviewedAt && (
            <p className="text-xs text-secondary mt-1">Selesai: {fmtDate(app.reviewedAt)}</p>
          )}
        </div>
        <Badge intent={meta.intent}>
          <span className="flex items-center gap-1">
            {meta.icon}
            {meta.label}
          </span>
        </Badge>
      </div>
    </div>
  );
}

// ─── Collapsible history section ─────────────────────────────────────────────
function RiwayatSection({ apps }: { apps: any[] }) {
  const [open, setOpen] = useState(true);

  // Group by status for summary
  const byStatus = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div
        className="flex items-center justify-between cursor-pointer group select-none"
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
      >
        <div>
          <h2 className="text-lg font-bold text-primary group-hover:text-brand-primary transition-colors">
            Riwayat Pendaftaran
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Semua pendaftaran yang sudah diproses &mdash; {apps.length} kegiatan
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mini summary badges */}
          <div className="hidden sm:flex items-center gap-2">
            {byStatus["APPROVED"] && (
              <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                {byStatus["APPROVED"]} diikuti
              </span>
            )}
            {byStatus["COMPLETED"] && (
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                {byStatus["COMPLETED"]} selesai
              </span>
            )}
            {byStatus["REPORT_SUBMITTED"] && (
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {byStatus["REPORT_SUBMITTED"]} menunggu verifikasi
              </span>
            )}
          </div>
          <div className="text-muted group-hover:text-primary transition-colors">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Cards */}
      {open && (
        <div className="space-y-3 animate-[fadeSlideIn_0.2s_ease-out_forwards]">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function VolunteerApplicationsPage() {
  const navigate = useNavigate();

  // Ambil semua aplikasi sekaligus, pisahkan di sisi client
  const { data: result, isLoading } = useQuery({
    queryKey: ["volunteer", "applications", "all"],
    queryFn: () => api.get<any[]>("/volunteers/applications"),
  });

  const all = result?.data ?? [];

  // PENDING + REJECTED → bagian "Pendaftaran Saya" (belum diproses / ditolak)
  const pending = all.filter((a) => a.status === "PENDING" || a.status === "REJECTED");

  // APPROVED + REPORT_SUBMITTED + COMPLETED → bagian "Riwayat Pendaftaran"
  const history = all.filter(
    (a) => a.status === "APPROVED" || a.status === "REPORT_SUBMITTED" || a.status === "COMPLETED",
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Pendaftaran Saya</h1>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border/40 p-5 animate-pulse">
              <div className="h-4 bg-surface-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-surface-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Bagian 1: Menunggu & Ditolak ── */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Pendaftaran Saya</h1>
          <p className="text-secondary mt-1">
            Kegiatan yang sedang menunggu persetujuan atau ditolak oleh lembaga.
          </p>
        </div>

        {pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Tidak Ada Pendaftaran Aktif"
            description="Tidak ada pendaftaran yang sedang menunggu persetujuan."
            actionText="Cari Kegiatan"
            onAction={() => navigate("/volunteer/activities")}
          />
        )}
      </div>

      {/* ── Divider ── */}
      {history.length > 0 && <hr className="border-border/40" />}

      {/* ── Bagian 2: Riwayat ── */}
      {history.length > 0 && <RiwayatSection apps={history} />}
    </div>
  );
}
