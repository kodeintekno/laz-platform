import { programsService } from "@/features/programs/services/programs.service";
import Link from "next/link";
import Image from "next/image";

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
          <Link href="/" className="text-xl font-bold text-brand-primary">
            LAZ Platform
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
          {programs.map((program) => {
            const currentAmount = Number(program.currentAmount);
            const targetAmount = Number(program.targetAmount);
            const progress = Math.min(100, Math.round((currentAmount / targetAmount) * 100));

            return (
              <div key={program.id} className="group relative bg-surface rounded-2xl shadow-soft hover:shadow-card transition overflow-hidden border border-border/40 flex flex-col">
                <div className="aspect-[16/9] w-full overflow-hidden bg-surface-soft relative">
                  {program.image ? (
                    <Image
                      src={program.image}
                      alt={program.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      Tidak ada gambar
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs font-semibold text-brand-primary shadow-soft">
                    {program.category}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-primary line-clamp-2 leading-tight mb-2">
                    <Link href={`/programs/${program.slug}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {program.title}
                    </Link>
                  </h3>
                  
                  <div className="mt-auto pt-4">
                    <div className="w-full bg-surface-soft rounded-full h-2 mb-3">
                      <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-secondary mb-0.5">Terkumpul</p>
                        <p className="text-sm font-bold text-primary">{formatRupiah(currentAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-secondary mb-0.5">Sisa Waktu</p>
                        <p className="text-sm font-medium text-primary">
                          {program.endDate ? Math.max(0, Math.ceil((new Date(program.endDate).getTime() - now) / (1000 * 60 * 60 * 24))) + " Hari" : "∞"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
