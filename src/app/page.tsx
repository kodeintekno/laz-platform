import { programsService } from "@/features/programs/services/programs.service";
import Link from "next/link";
import Image from "next/image";
import HeroSection from "@/components/ui/HeroSection";

export const metadata = {
  title: {
    absolute: "LAZ Platform | Aplikasi Manajemen Zakat & Donasi",
  },
  description: "Platform terpercaya untuk menyalurkan zakat, infak, dan sedekah Anda.",
};

export default async function Home() {
  const allPrograms = await programsService.getPublishedPrograms();
  const featuredPrograms = allPrograms.slice(0, 3);
  const now = Date.now();

  const formatRupiah = (amount: number | string) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 shadow-soft shadow-sm border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" alt="LAZ Platform Logo" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="text-xl font-bold text-primary">LAZ Platform</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/programs" className="text-sm text-secondary hover:text-primary font-semibold transition">
              Semua Program
            </Link>
            <Link href="/login" className="inline-block bg-success hover:bg-success/90 text-white font-medium py-3 px-8 rounded-xl transition">
              Login
            </Link>
          </div>
        </div>
      </header>

      <HeroSection />

      {/* Featured Programs Section */}
      <section id="featured" className="bg-surface-muted py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">
              Program Mendesak
            </h2>
            <p className="mt-4 text-lg text-secondary">
              Pilih program kebaikan yang ingin Anda bantu hari ini.
            </p>
          </div>
          {/* Sample Program Cards */}
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
            {/* Program 1: Food Aid */}
            <div className="group relative bg-surface rounded-2xl shadow-soft hover:border-success transition overflow-hidden flex flex-col border border-border/40">
              <div className="aspect-[16/9] w-full overflow-hidden bg-surface-soft relative">
                <Image
                  src="/images/programs/food_aid.png"
                  alt="Bantuan Makanan"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-primary line-clamp-2 mb-3 group-hover:text-success transition-colors">
                  Bantuan Makanan
                </h3>
                <p className="text-sm text-secondary line-clamp-2 mb-6">
                  Penyediaan paket sembako untuk keluarga yang membutuhkan di daerah rawan pangan.
                </p>
                <div className="mt-auto pt-4 border-t border-border/40">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-bold text-primary">Rp 500.000.000</p>
                    <p className="text-xs font-medium text-secondary">75%</p>
                  </div>
                  <div className="w-full bg-surface-soft rounded-full h-2 mb-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: `75%` }} />
                  </div>
                  <div className="mt-3 text-right">
                    <p className="text-xs text-secondary font-medium">30 Hari Tersisa</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Program 2: Education */}
            <div className="group relative bg-surface rounded-2xl shadow-soft hover:border-success transition overflow-hidden flex flex-col border border-border/40">
              <div className="aspect-[16/9] w-full overflow-hidden bg-surface-soft relative">
                <Image
                  src="/images/programs/education.png"
                  alt="Pendidikan Anak"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-primary line-clamp-2 mb-3 group-hover:text-success transition-colors">
                  Pendidikan Anak
                </h3>
                <p className="text-sm text-secondary line-clamp-2 mb-6">
                  Mendukung pendidikan formal dan non‑formal untuk anak‑anak kurang mampu.
                </p>
                <div className="mt-auto pt-4 border-t border-border/40">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-bold text-primary">Rp 300.000.000</p>
                    <p className="text-xs font-medium text-secondary">40%</p>
                  </div>
                  <div className="w-full bg-surface-soft rounded-full h-2 mb-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: `40%` }} />
                  </div>
                  <div className="mt-3 text-right">
                    <p className="text-xs text-secondary font-medium">60 Hari Tersisa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 text-center">
            <Link
              href="/programs"
              className="text-sm font-bold text-brand-primary hover:text-success bg-surface-soft px-6 py-3 rounded-xl transition border border-border/40"
            >
              Lihat Semua Program →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface shadow-sm py-12 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <p className="text-sm text-secondary">&copy; {new Date().getFullYear()} LAZ Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
