import { programsService } from "@/features/programs/services/programs.service";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const program = await programsService.getProgramBySlug(resolvedParams.slug);
  if (!program) return { title: "Not Found" };
  return { title: program.title };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const program = await programsService.getProgramBySlug(resolvedParams.slug);

  if (!program) {
    notFound();
  }

  const now = Date.now();

  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const currentAmount = Number(program.currentAmount);
  const targetAmount = Number(program.targetAmount);
  const progress = Math.min(100, Math.round((currentAmount / targetAmount) * 100));

  return (
    <div className="bg-surface-muted min-h-screen pb-20">
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-surface rounded-2xl shadow-soft border border-border/40 overflow-hidden lg:flex">
          {/* Image Section */}
          <div className="lg:w-7/12 relative aspect-[4/3] lg:aspect-auto bg-surface-soft">
            {program.imageUrl ? (
              <Image src={program.imageUrl} alt={program.title} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">Tidak ada gambar</div>
            )}
            <div className="absolute top-4 left-4 bg-brand-primary px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider text-white shadow-soft">
              {program.category}
            </div>
          </div>

          {/* Donation Box Section */}
          <div className="lg:w-5/12 p-6 lg:p-8 flex flex-col">
            <h1 className="text-2xl font-bold text-primary mb-6 leading-tight">
              {program.title}
            </h1>
            
            <div className="mb-6">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-bold text-brand-primary">{formatRupiah(currentAmount)}</span>
                <span className="text-sm text-secondary mb-1">terkumpul dari {formatRupiah(targetAmount)}</span>
              </div>
              <div className="w-full bg-surface-soft rounded-full h-2.5">
                <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-surface-muted p-4 rounded-2xl border border-border/40 text-center">
                <p className="text-sm text-secondary mb-1">Donatur</p>
                <p className="text-xl font-bold text-primary">{program.donations.length}</p>
              </div>
              <div className="bg-surface-muted p-4 rounded-2xl border border-border/40 text-center">
                <p className="text-sm text-secondary mb-1">Sisa Waktu</p>
                <p className="text-xl font-bold text-primary">
                  {program.endDate ? Math.max(0, Math.ceil((new Date(program.endDate).getTime() - now) / (1000 * 60 * 60 * 24))) : "∞"} Hari
                </p>
              </div>
            </div>

            <div className="mt-auto">
              <Link
                href={`/donate/${program.slug}`}
                className="block w-full rounded-xl bg-brand-primary px-3 py-4 text-center text-lg font-bold text-white shadow-soft hover:bg-brand-secondary transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              >
                Donasi Sekarang
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Story */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-2xl shadow-soft border border-border/40 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-primary mb-4 pb-4 border-b border-border/40">Cerita Penggalangan Dana</h2>
              <div className="prose prose-emerald max-w-none text-secondary whitespace-pre-wrap">
                {program.description}
              </div>
            </div>
          </div>

          {/* Donaturs & Distributions Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Donaturs */}
            <div className="bg-surface rounded-2xl shadow-soft border border-border/40 p-6">
              <h2 className="text-lg font-bold text-primary mb-4 pb-4 border-b border-border/40">Donasi Terbaru</h2>
              <div className="space-y-4">
                {program.donations.length > 0 ? (
                  program.donations.map((donation) => (
                    <div key={donation.id} className="flex gap-4 items-start">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                        {(donation.isAnonymous || !donation.user?.name) ? "H" : donation.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">
                          {donation.isAnonymous ? "Hamba Allah" : donation.user?.name || "Hamba Allah"}
                        </p>
                        <p className="text-sm font-semibold text-brand-primary">{formatRupiah(Number(donation.amount))}</p>
                        <p className="text-xs text-secondary mt-0.5">
                          {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(donation.createdAt))}
                        </p>
                        {donation.message && (
                          <p className="text-sm text-secondary italic mt-2 bg-surface-muted p-2 rounded-xl border border-border/40">
                             "{donation.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-secondary text-center py-4">Belum ada donasi. Jadilah yang pertama!</p>
                )}
              </div>
            </div>

            {/* Kabar Penyaluran */}
            <div className="bg-surface rounded-2xl shadow-soft border border-border/40 p-6">
              <h2 className="text-lg font-bold text-primary mb-4 pb-4 border-b border-border/40">Kabar Penyaluran</h2>
              <div className="space-y-6">
                {program.distributions && program.distributions.length > 0 ? (
                  program.distributions.filter(d => d.status === "COMPLETED").map((dist) => (
                    <div key={dist.id} className="border-l-2 border-brand-accent/30 pl-4 relative">
                      <div className="absolute w-3 h-3 bg-brand-primary rounded-full -left-[7px] top-1.5"></div>
                      <p className="text-xs text-secondary mb-1">
                        {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(dist.createdAt))}
                      </p>
                      <h3 className="text-sm font-bold text-primary">{dist.title}</h3>
                      <p className="text-sm font-bold text-success my-1">
                        Tersalurkan: {formatRupiah(Number(dist.amount))}
                      </p>
                      <p className="text-sm text-secondary line-clamp-3 mb-2">{dist.description}</p>
                      {dist.receiptImageUrl && (
                        <a href={dist.receiptImageUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-primary hover:underline font-semibold">
                          Lihat Bukti Penyaluran &rarr;
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-secondary text-center py-4">Belum ada kabar penyaluran dana.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
