import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useVolunteerAuth } from "@/auth/VolunteerAuthProvider";
import { Badge } from "@/components/ui";

const STATUS_META: Record<string, { label: string; intent: "success" | "warning" | "destructive" }> = {
  PENDING: { label: "Menunggu Persetujuan", intent: "warning" },
  APPROVED: { label: "Sedang Diikuti", intent: "success" },
  REJECTED: { label: "Ditolak", intent: "destructive" },
  REPORT_SUBMITTED: { label: "Menunggu Verifikasi Laporan", intent: "warning" },
  COMPLETED: { label: "Selesai", intent: "success" },
};

export function VolunteerDashboardPage() {
  const { volunteer } = useVolunteerAuth();

  const { data: applicationsResult } = useQuery({
    queryKey: ["volunteer", "applications", "all"],
    queryFn: () => api.get<any[]>("/volunteers/applications", { scope: "all" }),
  });

  const applications = applicationsResult?.data ?? [];
  const pendingCount = applications.filter((a) => a.status === "PENDING").length;
  const activeCount = applications.filter((a) => a.status === "APPROVED" || a.status === "REPORT_SUBMITTED").length;
  const completedCount = applications.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Selamat datang, {volunteer?.name}!</h1>
        <p className="text-secondary mt-1">Terima kasih telah bergabung sebagai relawan di Ruang Berbagi.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl border border-border/40 p-5">
          <p className="text-xs text-secondary uppercase tracking-wide">Total Pendaftaran</p>
          <p className="text-2xl font-bold text-primary mt-1">{applications.length}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border/40 p-5">
          <p className="text-xs text-secondary uppercase tracking-wide">Menunggu Persetujuan</p>
          <p className="text-2xl font-bold text-warning mt-1">{pendingCount}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border/40 p-5">
          <p className="text-xs text-secondary uppercase tracking-wide">Sedang Diikuti</p>
          <p className="text-2xl font-bold text-success mt-1">{activeCount}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border/40 p-5">
          <p className="text-xs text-secondary uppercase tracking-wide">Selesai</p>
          <p className="text-2xl font-bold text-success mt-1">{completedCount}</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">Pendaftaran Terbaru</h2>
          <Link to="/volunteer/applications" className="text-sm font-semibold text-brand-primary hover:underline">
            Lihat Semua
          </Link>
        </div>
        {applications.length > 0 ? (
          <div className="space-y-3">
            {applications.slice(0, 5).map((app: any) => {
              const meta = STATUS_META[app.status] ?? { label: app.status, intent: "warning" as const };
              return (
                <div key={app.id} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0">
                  <div>
                    <p className="font-semibold text-primary">{app.activity?.title}</p>
                    <p className="text-xs text-secondary">{app.lembaga?.name}</p>
                  </div>
                  <Badge intent={meta.intent}>{meta.label}</Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-secondary">
            Anda belum mendaftar ke kegiatan manapun.{" "}
            <Link to="/volunteer/activities" className="text-brand-primary font-semibold hover:underline">
              Cari kegiatan sekarang
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
