import { programsService } from "@/features/programs/services/programs.service";
import { analyticsRepository } from "@/features/analytics/repositories/analytics.repository";
import { auth } from "@/lib/auth";
import HeroSection from "@/components/ui/HeroSection";
import {
  ProgramCard,
  PublicHeader,
  TrustIndicators,
  HowItWorks,
  ImpactStats,
  PublicFooter,
  EmptyState,
} from "@/components/ui";

export const metadata = {
  title: {
    absolute: "LAZ Platform | Aplikasi Manajemen Zakat & Donasi",
  },
  description: "Platform terpercaya untuk menyalurkan zakat, infak, dan sedekah Anda.",
};

export default async function Home() {
  const [allPrograms, stats, session] = await Promise.all([
    programsService.getPublishedPrograms(),
    analyticsRepository.getDashboardMetrics(undefined),
    auth(),
  ]);

  const featuredPrograms = allPrograms.slice(0, 3);
  const now = Date.now();

  return (
    <div className="bg-surface min-h-screen flex flex-col justify-between">
      <div>
        {/* Session-aware Public Header */}
        <PublicHeader user={session?.user} />

        {/* Hero Section */}
        <HeroSection />

        {/* Trust Indicators */}
        <TrustIndicators />

        {/* Featured Programs Section */}
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

            {/* Programs list empty state check */}
            {featuredPrograms.length > 0 ? (
              <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {featuredPrograms.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={{
                      id: program.id,
                      slug: program.slug,
                      title: program.title,
                      description: program.description,
                      imageUrl: program.imageUrl,
                      category: program.category,
                      targetAmount: program.targetAmount.toNumber(),
                      currentAmount: program.currentAmount.toNumber(),
                      endDate: program.endDate,
                      laz: program.laz,
                    }}
                    now={now}
                    isPriority={true}
                  />
                ))}
              </div>
            ) : (
              <div className="max-w-md mx-auto py-8">
                <EmptyState
                  title="Belum Ada Program Aktif"
                  description="Saat ini belum ada program penggalangan dana yang aktif. Silakan kembali beberapa saat lagi."
                />
              </div>
            )}

            {featuredPrograms.length > 0 && (
              <div className="mt-16 text-center">
                <a
                  href="/programs"
                  className="text-sm font-bold text-brand-primary hover:text-success bg-surface-soft px-6 py-3 rounded-xl transition border border-border/40 cursor-pointer"
                >
                  Lihat Semua Program →
                </a>
              </div>
            )}
          </div>
        </section>

        {/* How It Works Section */}
        <HowItWorks />

        {/* Impact Statistics */}
        <ImpactStats
          totalDonations={stats.totalDonations}
          totalDistributed={stats.totalDistributed}
          activePrograms={stats.activePrograms}
          totalDonors={stats.activeUsers}
        />

        {/* About Section */}
        <section id="about" className="bg-surface py-20 px-4 sm:px-6 lg:px-8 border-t border-border/40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Tentang Kami</span>
              <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl leading-tight">
                Menjembatani Kebaikan dengan Amanah Terpercaya
              </h2>
              <p className="text-sm text-secondary leading-relaxed">
                LAZ Platform adalah wadah digital inovatif yang dirancang khusus untuk memfasilitasi berbagai Lembaga Amil Zakat (LAZ) resmi di Indonesia dalam menghimpun dan menyalurkan dana zakat, infak, sedekah, dan wakaf (ZISWAF).
              </p>
              <p className="text-sm text-secondary leading-relaxed">
                Misi utama kami adalah menghadirkan transparansi penuh bagi para donatur, memberikan kemudahan akses pelaporan secara berkala, serta mempercepat distribusi bantuan ke berbagai sektor kemanusiaan yang membutuhkan.
              </p>
            </div>
            <div className="md:w-1/2 flex justify-center items-center">
              <div className="bg-gradient-to-br from-brand-primary/10 to-success/10 p-12 rounded-3xl border border-brand-primary/20 max-w-sm w-full text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
                  100%
                </div>
                <h4 className="text-lg font-bold text-primary">Amanah & Profesional</h4>
                <p className="text-xs text-secondary leading-relaxed">
                  Setiap program yang terdaftar telah melewati proses verifikasi ketat untuk menjamin orisinalitas dan kelayakan penerima manfaat.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
