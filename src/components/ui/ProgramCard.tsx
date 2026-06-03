import Link from "next/link";
import Image from "next/image";

export interface ProgramCardProps {
  program: {
    id: string;
    slug: string;
    title: string;
    description: string;
    imageUrl: string | null;
    category: string;
    targetAmount: number;
    currentAmount: number;
    endDate: Date | null;
  };
  now?: number;
}

export function ProgramCard({ program, now = Date.now() }: ProgramCardProps) {
  const targetNum = program.targetAmount;
  const currentNum = program.currentAmount;
  const progress = targetNum > 0 ? (currentNum / targetNum) * 100 : 0;
  const safeProgress = Math.min(Math.round(progress), 100);

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  let daysRemainingText = "Tanpa Batas Waktu";
  if (program.endDate) {
    const days = Math.ceil((new Date(program.endDate).getTime() - now) / (1000 * 60 * 60 * 24));
    if (days > 0) {
      daysRemainingText = `${days} Hari Tersisa`;
    } else if (days === 0) {
      daysRemainingText = "Berakhir Hari Ini";
    } else {
      daysRemainingText = "Selesai";
    }
  }

  return (
    <Link
      href={`/programs/${program.slug}`}
      className="group relative bg-surface rounded-2xl shadow-soft hover:border-success transition overflow-hidden flex flex-col border border-border/40"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-surface-soft relative">
        {program.imageUrl ? (
          <Image
            src={program.imageUrl}
            alt={program.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-muted text-muted font-medium text-sm">
            Tidak Ada Gambar
          </div>
        )}
        <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs font-semibold text-brand-primary shadow-soft">
          {program.category}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-primary line-clamp-2 mb-3 group-hover:text-success transition-colors">
          {program.title}
        </h3>
        <p className="text-sm text-secondary line-clamp-2 mb-6">
          {program.description}
        </p>
        <div className="mt-auto pt-4 border-t border-border/40">
          <div className="flex justify-between items-end mb-2">
            <p className="text-sm font-bold text-primary">{formatRupiah(targetNum)}</p>
            <p className="text-xs font-medium text-secondary">{safeProgress}%</p>
          </div>
          <div className="w-full bg-surface-soft rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-success h-full rounded-full transition-all duration-500"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <p className="text-xs text-secondary mb-0.5">Terkumpul</p>
              <p className="text-sm font-bold text-brand-primary">{formatRupiah(currentNum)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-secondary mb-0.5">Sisa Waktu</p>
              <p className="text-sm font-medium text-primary">{daysRemainingText}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
