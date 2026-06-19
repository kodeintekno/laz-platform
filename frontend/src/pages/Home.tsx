import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  ProgramCard,
  EmptyState,
  HeroSection,
  TrustIndicators,
  HowItWorks,
  ImpactStats,
} from "@/components/ui";
import { Link } from "react-router-dom";

export function HomePage() {
  const now = Date.now();

  const { data: programsResult } = useQuery({
    queryKey: ["public", "programs"],
    queryFn: () => api.get<any[]>("/public/programs"),
  });

  const { data: statsResult } = useQuery({
    queryKey: ["public", "stats"],
    queryFn: () => api.get<any>("/public/stats"),
  });

  const featuredPrograms = (programsResult?.data ?? []).slice(0, 3);
  const stats = statsResult?.data ?? {};

  return (
    <div className="bg-surface">
      <HeroSection />
      <TrustIndicators />

      <section id="featured" className="bg-surface-muted py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">
              Program Mendesak
            </h2>
            <p className="mt-4 text-lg text-secondary">
              Pilih program kebaikan yang ingin Anda bantu hari ini.
            </p>
          </div>

          {featuredPrograms.length > 0 ? (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
              {featuredPrograms.map((program: any) => (
                <ProgramCard key={program.id} program={program} now={now} isPriority />
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto py-8">
              <EmptyState
                title="Belum Ada Program Aktif"
                description="Saat ini belum ada program penggalangan dana yang aktif."
              />
            </div>
          )}

          {featuredPrograms.length > 0 && (
            <div className="mt-16 text-center">
              <Link
                to="/programs"
                className="text-sm font-bold text-brand-primary hover:text-success bg-surface-soft px-6 py-3 rounded-xl transition border border-border/40"
              >
                Lihat Semua Program →
              </Link>
            </div>
          )}
        </div>
      </section>

      <HowItWorks />

      <ImpactStats
        totalDonations={stats.totalDonations ?? 0}
        totalDistributed={stats.totalDistributed ?? 0}
        activePrograms={stats.activePrograms ?? 0}
        totalDonors={stats.activeUsers ?? 0}
      />

      <section id="about" className="bg-surface py-20 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Tentang Kami</span>
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl leading-tight">
              Menjembatani Kebaikan dengan Amanah Terpercaya
            </h2>
            <p className="text-sm text-secondary leading-relaxed">
              LAZ Platform adalah wadah digital inovatif yang dirancang khusus untuk memfasilitasi berbagai
              Lembaga Amil Zakat (LAZ) resmi di Indonesia dalam menghimpun dan menyalurkan dana zakat, infak,
              sedekah, dan wakaf (ZISWAF).
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center items-center">
            <div className="bg-gradient-to-br from-brand-primary/10 to-success/10 p-12 rounded-3xl border border-brand-primary/20 max-w-sm w-full text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex flex-col items-center justify-center font-black mx-auto shadow-soft ring-8 ring-brand-primary/10">
                <span className="text-3xl tracking-tighter leading-none">100%</span>
                <span className="text-[10px] uppercase tracking-widest text-brand-soft mt-1 font-bold">Amanah</span>
              </div>
              <h4 className="text-lg font-bold text-primary">Amanah & Profesional</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Setiap program yang terdaftar telah melewati proses verifikasi ketat untuk menjamin orisinalitas
                dan kelayakan penerima manfaat.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
