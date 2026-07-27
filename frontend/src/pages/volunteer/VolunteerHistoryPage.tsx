import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Badge, EmptyState } from "@/components/ui";

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d));

export function VolunteerHistoryPage() {
  const { data: result, isLoading } = useQuery({
    queryKey: ["volunteer", "applications", "completed"],
    queryFn: () => api.get<any[]>("/volunteers/applications", { scope: "completed" }),
  });

  const applications = result?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Riwayat & Kontribusi</h1>
        <p className="text-secondary mt-1">Kegiatan yang telah Anda selesaikan dan diverifikasi oleh lembaga.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-secondary">Memuat...</p>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-surface rounded-2xl border border-border/40 p-5">
            <p className="text-xs text-secondary uppercase tracking-wide">Total Kontribusi Selesai</p>
            <p className="text-2xl font-bold text-success mt-1">{applications.length} Kegiatan</p>
          </div>

          {applications.map((app: any) => (
            <div key={app.id} className="bg-surface rounded-2xl border border-border/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-primary">{app.activity?.title}</p>
                  <p className="text-xs text-secondary">{app.lembaga?.name}</p>
                  {app.verifiedAt && (
                    <p className="text-xs text-secondary">Terverifikasi {fmtDate(app.verifiedAt)}</p>
                  )}
                </div>
                <Badge intent="success">Selesai</Badge>
              </div>
              {app.reportText && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-sm text-secondary whitespace-pre-line">{app.reportText}</p>
                </div>
              )}
              {app.reportNote && (
                <p className="text-xs text-secondary mt-2 italic">Catatan lembaga: {app.reportNote}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum Ada Riwayat"
          description="Kegiatan yang sudah selesai dan diverifikasi lembaga akan muncul di sini."
        />
      )}
    </div>
  );
}
