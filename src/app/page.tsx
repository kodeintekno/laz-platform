import { programsService } from "@/features/programs/services/programs.service";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: {
    absolute: "LAZ Platform | Aplikasi Manajemen Zakat & Donasi",
  },
  description: "Platform terpercaya untuk menyalurkan zakat, infak, dan sedekah Anda.",
};

export default async function Home() {
  // Fetch only the top 3 most recent published programs
  const allPrograms = await programsService.getPublishedPrograms();
  const featuredPrograms = allPrograms.slice(0, 3);
  const now = Date.now();

  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Shared Public Header */}
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 shadow-soft border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-brand-primary">
            LAZ Platform
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/programs" className="text-sm text-text-secondary hover:text-brand-primary font-semibold transition">
              Semua Program
            </Link>
            <Link href="/dashboard" className="text-sm bg-surface-soft text-brand-primary hover:bg-brand-primary/10 px-4 py-2 rounded-xl font-semibold transition">
              Dashboard Admin
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-surface">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-5"></div>
          <div className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-surface shadow-soft shadow-brand-primary/5 ring-1 ring-surface-soft sm:-mr-80 lg:-mr-96"></div>
          
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pb-32 lg:flex lg:px-8 lg:py-32 items-center">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 pt-8">
              <h1 className="mt-10 text-4xl font-extrabold tracking-tight text-text-primary sm:text-6xl leading-tight">
                Kebaikan Anda, <br/>
                <span className="text-brand-accent">
                  Harapan Mereka.
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-text-secondary">
                Salurkan Zakat, Infak, dan Sedekah dengan mudah, transparan, dan tepat sasaran. Setiap rupiah yang Anda donasikan dilacak dan dilaporkan secara terbuka.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link
                  href="/programs"
                  className="rounded-xl bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-soft hover:bg-brand-secondary hover:scale-105 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                >
                  Mulai Berdonasi
                </Link>
                <Link href="#featured" className="text-sm font-semibold leading-6 text-text-primary flex items-center gap-2 group">
                  Lihat Program <span aria-hidden="true" className="group-hover:translate-y-1 transition-transform">↓</span>
                </Link>
              </div>
            </div>
            
            <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
              <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                <div className="relative rounded-2xl bg-brand-primary/5 p-2 ring-1 ring-inset ring-brand-primary/10 lg:-m-4 lg:rounded-3xl lg:p-4 hover:-translate-y-2 transition duration-500 shadow-card">
                  <Image
                    src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop"
                    alt="Donation Impact"
                    width={800}
                    height={600}
                    className="w-[40rem] rounded-xl shadow-card ring-1 ring-brand-primary/10 object-cover aspect-[4/3]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Programs Section */}
        <section id="featured" className="bg-surface-muted py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Program Mendesak</h2>
              <p className="mt-4 text-lg text-text-secondary">
                Pilih program kebaikan yang ingin Anda bantu hari ini.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
              {featuredPrograms.map((program) => {
                const currentAmount = Number(program.currentAmount);
                const targetAmount = Number(program.targetAmount);
                const progress = Math.min(100, Math.round((currentAmount / targetAmount) * 100));

                return (
                  <div key={program.id} className="group relative bg-surface rounded-xl shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-border flex flex-col">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-surface-soft relative">
                      {program.image ? (
                        <Image
                          src={program.image}
                          alt={program.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          Tidak ada gambar
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-brand-primary shadow-soft">
                        {program.category}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-text-primary line-clamp-2 leading-tight mb-3 group-hover:text-brand-primary transition-colors">
                        <Link href={`/programs/${program.slug}`}>
                          <span aria-hidden="true" className="absolute inset-0" />
                          {program.title}
                        </Link>
                      </h3>
                      
                      <p className="text-sm text-text-secondary line-clamp-2 mb-6">
                        {program.description}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-surface-soft">
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-sm font-bold text-brand-primary">{formatRupiah(currentAmount)}</p>
                          <p className="text-xs font-medium text-text-secondary">{progress}%</p>
                        </div>
                        <div className="w-full bg-surface-soft rounded-full h-2">
                          <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="mt-3 text-right">
                          <p className="text-xs text-text-secondary font-medium">
                            {program.endDate ? Math.max(0, Math.ceil((new Date(program.endDate).getTime() - now) / (1000 * 60 * 60 * 24))) + " Hari Tersisa" : "Tanpa Batas Waktu"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-16 text-center">
              <Link href="/programs" className="text-sm font-bold text-brand-primary hover:text-brand-secondary bg-surface-soft px-6 py-3 rounded-xl transition">
                Lihat Semua Program &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-surface border-t border-border py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()} LAZ Platform. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
