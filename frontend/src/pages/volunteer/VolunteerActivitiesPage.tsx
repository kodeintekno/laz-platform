import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { EmptyState, Button } from "@/components/ui";
import { toast } from "@/stores/toast.store";

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d));

export function VolunteerActivitiesPage() {
  const queryClient = useQueryClient();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const { data: activitiesResult, isLoading } = useQuery({
    queryKey: ["volunteer", "activities"],
    queryFn: () => api.get<any[]>("/volunteers/activities"),
  });

  const { data: applicationsResult } = useQuery({
    queryKey: ["volunteer", "applications", "all"],
    queryFn: () => api.get<any[]>("/volunteers/applications", { scope: "all" }),
  });

  const appliedActivityIds = new Set((applicationsResult?.data ?? []).map((a: any) => a.activityId));
  const activities = activitiesResult?.data ?? [];

  const handleApply = async (activityId: string) => {
    setApplyingId(activityId);
    try {
      await api.post("/volunteers/applications", { activityId });
      toast.success("Berhasil mendaftar! Menunggu persetujuan dari admin lembaga.");
      queryClient.invalidateQueries({ queryKey: ["volunteer", "applications"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal mendaftar ke kegiatan ini");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Cari Kegiatan</h1>
        <p className="text-secondary mt-1">Temukan kegiatan relawan yang membuka pendaftaran dari berbagai lembaga.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-secondary">Memuat kegiatan...</p>
      ) : activities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity: any) => {
            const alreadyApplied = appliedActivityIds.has(activity.id);
            const filled = activity._count?.applications ?? 0;
            const isFull = !!activity.quota && filled >= activity.quota;
            return (
              <div key={activity.id} className="bg-surface rounded-2xl border border-border/40 p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  {activity.lembaga?.logoUrl && (
                    <img src={activity.lembaga.logoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                  )}
                  <p className="text-xs font-bold text-brand-primary uppercase tracking-wide">
                    {activity.lembaga?.name}
                  </p>
                </div>
                <h3 className="font-bold text-primary mb-2">{activity.title}</h3>
                <p className="text-sm text-secondary line-clamp-3 mb-3">{activity.description}</p>
                <div className="text-xs text-secondary space-y-1 mb-4">
                  {activity.location && <p>📍 {activity.location}</p>}
                  {activity.activityDate && <p>🗓️ {fmtDate(activity.activityDate)}</p>}
                  {activity.quota && <p>👥 {filled}/{activity.quota} relawan</p>}
                  {activity.program?.title && <p>🔗 Program: {activity.program.title}</p>}
                </div>
                <Button
                  className="mt-auto"
                  disabled={alreadyApplied || isFull || applyingId === activity.id}
                  isLoading={applyingId === activity.id}
                  onClick={() => handleApply(activity.id)}
                >
                  {alreadyApplied ? "Sudah Mendaftar" : isFull ? "Kuota Penuh" : "Daftar sebagai Relawan"}
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Belum Ada Kegiatan" description="Belum ada kegiatan relawan yang membuka pendaftaran saat ini." />
      )}
    </div>
  );
}
