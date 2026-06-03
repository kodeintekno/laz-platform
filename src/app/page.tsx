import { programsService } from "@/features/programs/services/programs.service";
import Link from "next/link";
import Image from "next/image";
import HeroSection from "@/components/ui/HeroSection";
import { ProgramCard } from "@/components/ui";

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
