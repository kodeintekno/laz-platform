import { programsService } from "@/features/programs/services/programs.service";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const program = await programsService.getProgramBySlug(resolvedParams.slug);
  if (!program) return { title: "Not Found" };
  return { title: `${program.title} | LAZ Platform` };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const program = await programsService.getProgramBySlug(resolvedParams.slug);

  if (!program) {
    notFound();
  }

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
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Simple Public Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            LAZ Platform
          </Link>
          <div className="flex gap-4">
            <Link href="/programs" className="text-gray-600 hover:text-gray-900 font-medium">
              Donasi
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:flex">
          {/* Image Section */}
          <div className="lg:w-7/12 relative aspect-[4/3] lg:aspect-auto bg-gray-200">
            {program.image ? (
              <Image src={program.image} alt={program.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Tidak ada gambar</div>
            )}
            <div className="absolute top-4 left-4 bg-indigo-600 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider text-white shadow-sm">
              {program.category}
            </div>
          </div>

          {/* Donation Box Section */}
          <div className="lg:w-5/12 p-6 lg:p-8 flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">
              {program.title}
            </h1>
            
            <div className="mb-6">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-bold text-indigo-600">{formatRupiah(currentAmount)}</span>
                <span className="text-sm text-gray-500 mb-1">terkumpul dari {formatRupiah(targetAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-1">Donatur</p>
                <p className="text-xl font-bold text-gray-900">{program.donations.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-1">Sisa Waktu</p>
                <p className="text-xl font-bold text-gray-900">
                  {program.endDate ? Math.max(0, Math.ceil((new Date(program.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : "∞"} Hari
                </p>
              </div>
            </div>

            <div className="mt-auto">
              <Link
                href={`/donate/${program.slug}`}
                className="block w-full rounded-xl bg-indigo-600 px-3 py-4 text-center text-lg font-bold text-white shadow-md hover:bg-indigo-500 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Donasi Sekarang
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Story */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">Cerita Penggalangan Dana</h2>
              <div className="prose prose-indigo max-w-none text-gray-600 whitespace-pre-wrap">
                {program.description}
              </div>
            </div>
          </div>

          {/* Donaturs & Distributions Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Donaturs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">Donasi Terbaru</h2>
              <div className="space-y-4">
                {program.donations.length > 0 ? (
                  program.donations.map((donation) => (
                    <div key={donation.id} className="flex gap-4 items-start">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {(donation.isAnonymous || !donation.user?.name) ? "H" : donation.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {donation.isAnonymous ? "Hamba Allah" : donation.user?.name || "Hamba Allah"}
                        </p>
                        <p className="text-sm font-semibold text-indigo-600">{formatRupiah(Number(donation.amount))}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(donation.createdAt))}
                        </p>
                        {donation.message && (
                          <p className="text-sm text-gray-600 italic mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                            "{donation.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Belum ada donasi. Jadilah yang pertama!</p>
                )}
              </div>
            </div>

            {/* Kabar Penyaluran */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">Kabar Penyaluran</h2>
              <div className="space-y-6">
                {program.distributions && program.distributions.length > 0 ? (
                  program.distributions.filter(d => d.status === "COMPLETED").map((dist) => (
                    <div key={dist.id} className="border-l-2 border-indigo-200 pl-4 relative">
                      <div className="absolute w-3 h-3 bg-indigo-600 rounded-full -left-[7px] top-1.5"></div>
                      <p className="text-xs text-gray-500 mb-1">
                        {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(dist.createdAt))}
                      </p>
                      <h3 className="text-sm font-bold text-gray-900">{dist.title}</h3>
                      <p className="text-sm font-bold text-green-600 my-1">
                        Tersalurkan: {formatRupiah(Number(dist.amount))}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-2">{dist.description}</p>
                      {dist.receiptImage && (
                        <a href={dist.receiptImage} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline font-medium">
                          Lihat Bukti Penyaluran &rarr;
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Belum ada kabar penyaluran dana.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
