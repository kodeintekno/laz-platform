import { programsService } from "@/features/programs/services/programs.service";
import Link from "next/link";
import Image from "next/image";
import { ProgramCard } from "@/components/ui";

export const metadata = {
  title: "Program Donasi",
  description: "Daftar program donasi, zakat, infak, dan sedekah.",
};

export default async function PublicProgramsPage() {
  const programs = await programsService.getPublishedPrograms();
  const now = Date.now();

  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  return (
    <div className="bg-surface-muted min-h-screen">
      {/* Simple Public Header */}
      <header className="bg-surface shadow-soft border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" alt="LAZ Platform Logo" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="text-xl font-bold text-brand-primary">LAZ Platform</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/programs" className="text-secondary hover:text-brand-primary font-semibold">
              Donasi
            </Link>
            <Link href="/dashboard" className="text-brand-primary hover:text-brand-secondary font-semibold">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Pilih Program Kebaikanmu
          </h1>
          <p className="mt-4 text-lg text-secondary">
            Salurkan zakat, infak, dan sedekah Anda kepada yang membutuhkan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={{
                id: program.id,
                slug: program.slug,
                title: program.title,
                description: program.description,
                imageUrl: program.imageUrl,
                category: program.category,
                targetAmount: Number(program.targetAmount),
                currentAmount: Number(program.currentAmount),
                endDate: program.endDate,
                laz: program.laz,
              }}
              now={now}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
