import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { HeartHandshake } from "lucide-react";
import { api } from "@/lib/api-client";
import { useVolunteerAuth } from "@/auth/VolunteerAuthProvider";
import { EmptyState, Button } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d));

export function VolunteerLandingPage() {
  const navigate = useNavigate();
  const { volunteer, isLoading: isAuthLoading } = useVolunteerAuth();

  const { data: result, isLoading } = useQuery({
    queryKey: ["public", "volunteer-activities"],
    queryFn: () => api.get<any[]>("/volunteers/activities"),
  });

  const activities = result?.data ?? [];

  const handleDaftar = () => {
    if (isAuthLoading) return;
    if (volunteer) {
      navigate("/volunteer/activities");
    } else {
      navigate("/login");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary mb-4">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">Jadi Relawan</h1>
        <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
          Ikut serta dalam kegiatan-kegiatan yang dibuat oleh lembaga-lembaga di Ruang Berbagi. Satu akun relawan
          dapat mengikuti kegiatan dari lembaga manapun.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : activities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity: any) => {
            const filled = activity._count?.applications ?? 0;
            const isFull = !!activity.quota && filled >= activity.quota;
            return (
              <div key={activity.id} className="bg-surface rounded-2xl border border-border/40 shadow-soft p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {activity.lembaga?.logoUrl ? (
                    <img src={activity.lembaga.logoUrl} alt={activity.lembaga.name} className="w-8 h-8 rounded-full object-cover border border-border/40" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-[10px] font-bold text-primary border border-border/40">
                      {activity.lembaga?.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <p className="text-xs font-bold text-brand-primary uppercase tracking-wide">{activity.lembaga?.name}</p>
                </div>

                <h3 className="font-bold text-primary text-lg">{activity.title}</h3>
                <p className="text-sm text-secondary line-clamp-3">{activity.description}</p>

                <div className="text-xs text-secondary space-y-1">
                  {activity.location && <p>📍 {activity.location}</p>}
                  {activity.activityDate && <p>🗓️ {fmtDate(activity.activityDate)}</p>}
                  {activity.quota && <p>👥 {filled}/{activity.quota} relawan</p>}
                  {activity.program?.title && <p>🔗 Program: {activity.program.title}</p>}
                </div>

                <Button className="mt-auto" disabled={isFull} onClick={handleDaftar}>
                  {isFull ? "Kuota Penuh" : "Daftar Relawan"}
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Belum Ada Kegiatan Relawan" description="Belum ada lembaga yang membuka kegiatan relawan saat ini. Silakan cek kembali nanti." />
      )}
    </main>
  );
}
