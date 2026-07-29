import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-client";
import { Badge, EmptyState } from "@/components/ui";

const STATUS_META: Record<string, { label: string; intent: "success" | "warning" | "destructive" }> = {
  PENDING: { label: "Menunggu Persetujuan", intent: "warning" },
  REJECTED: { label: "Ditolak", intent: "destructive" },
};

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d));

export function VolunteerApplicationsPage() {
  const navigate = useNavigate();
  const { data: result, isLoading } = useQuery({
    queryKey: ["volunteer", "applications", "pending"],
    queryFn: () => api.get<any[]>("/volunteers/applications", { scope: "pending" }),
  });

  const applications = result?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Pendaftaran Saya</h1>
        <p className="text-secondary mt-1">Kegiatan yang sedang menunggu persetujuan atau ditolak oleh lembaga.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-secondary">Memuat...</p>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app: any) => {
            const meta = STATUS_META[app.status] ?? { label: app.status, intent: "warning" as const };
            return (
              <div key={app.id} className="bg-surface rounded-2xl border border-border/40 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-primary">{app.activity?.title}</p>
                  <p className="text-xs text-secondary">{app.lembaga?.name} &middot; Didaftarkan {fmtDate(app.createdAt)}</p>
                  {app.status === "REJECTED" && app.rejectionReason && (
                    <p className="text-xs text-destructive mt-1">Alasan: {app.rejectionReason}</p>
                  )}
                </div>
                <Badge intent={meta.intent}>{meta.label}</Badge>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Belum Ada Pendaftaran"
          description="Anda belum mendaftar ke kegiatan relawan manapun."
          actionText="Cari Kegiatan"
          onAction={() => navigate("/volunteer/activities")}
        />
      )}
    </div>
  );
}
