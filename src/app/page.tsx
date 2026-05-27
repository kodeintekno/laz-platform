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
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-soft border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-[#0F3D2E]">
            LAZ Platform
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/programs" className="text-sm text-[#6B7280] hover:text-[#0F3D2E] font-semibold transition">
              Semua Program
            </Link>
            <Link href="/login" className="text-sm bg-[#F8FAF7] text-[#0F3D2E] hover:bg-[#D1FAE5] px-4 py-2 rounded-xl font-semibold transition">
              Login
            </Link>
          </div>
        </div>
      </header>

      <HeroSection />

      {/* Featured Programs Section */}
      <section id="featured" className="bg-[#F8FAF7] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F3D2E] sm:text-4xl">
              Program Mendesak
            </h2>
            <p className="mt-4 text-lg text-[#6B7280]">
              Pilih program kebaikan yang ingin Anda bantu hari ini.
            </p>
          </div>
          {/* Sample Program Cards */}
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
            {/* Program 1: Food Aid */}
            <div className="group relative bg-white rounded-[12px] shadow-sm border border-[#E5E7EB] hover:border-[#16A34A] transition overflow-hidden flex flex-col">
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#F8FAF7] relative">
                <Image
                  src="/images/programs/food_aid.png"
                  alt="Bantuan Makanan"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-[#0F3D2E] line-clamp-2 mb-3 group-hover:text-[#16A34A] transition-colors">
                  Bantuan Makanan
                </h3>
                <p className="text-sm text-[#6B7280] line-clamp-2 mb-6">
                  Penyediaan paket sembako untuk keluarga yang membutuhkan di daerah rawan pangan.
                </p>
                <div className="mt-auto pt-4 border-t border-[#E5E7EB]">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-bold text-[#0F3D2E]">Rp 500.000.000</p>
                    <p className="text-xs font-medium text-[#6B7280]">75%</p>
                  </div>
                  <div className="w-full bg-[#E5E7EB] rounded-full h-2 mb-2">
                    <div className="bg-[#16A34A] h-2 rounded-full" style={{ width: `75%` }} />
                  </div>
                  <div className="mt-3 text-right">
                    <p className="text-xs text-[#6B7280] font-medium">30 Hari Tersisa</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Program 2: Education */}
            <div className="group relative bg-white rounded-[12px] shadow-sm border border-[#E5E7EB] hover:border-[#16A34A] transition overflow-hidden flex flex-col">
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#F8FAF7] relative">
                <Image
                  src="/images/programs/education.png"
                  alt="Pendidikan Anak"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-[#0F3D2E] line-clamp-2 mb-3 group-hover:text-[#16A34A] transition-colors">
                  Pendidikan Anak
                </h3>
                <p className="text-sm text-[#6B7280] line-clamp-2 mb-6">
                  Mendukung pendidikan formal dan non‑formal untuk anak‑anak kurang mampu.
                </p>
                <div className="mt-auto pt-4 border-t border-[#E5E7EB]">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-bold text-[#0F3D2E]">Rp 300.000.000</p>
                    <p className="text-xs font-medium text-[#6B7280]">40%</p>
                  </div>
                  <div className="w-full bg-[#E5E7EB] rounded-full h-2 mb-2">
                    <div className="bg-[#16A34A] h-2 rounded-full" style={{ width: `40%` }} />
                  </div>
                  <div className="mt-3 text-right">
                    <p className="text-xs text-[#6B7280] font-medium">60 Hari Tersisa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 text-center">
            <Link
              href="/programs"
              className="text-sm font-bold text-[#0F3D2E] hover:text-[#16A34A] bg-[#F8FAF7] px-6 py-3 rounded-xl transition"
            >
              Lihat Semua Program →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <p className="text-sm text-[#6B7280]">&copy; {new Date().getFullYear()} LAZ Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
