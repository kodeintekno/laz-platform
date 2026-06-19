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
    laz?: {
      name: string;
      logoUrl: string | null;
    } | null;
  };
  now?: number;
  isPriority?: boolean;
}

export function ProgramCard({ program, now = Date.now(), isPriority = false }: ProgramCardProps) {
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
            priority={isPriority}
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
      <div className="p-5 flex-1 flex flex-col">
        {program.laz && (
          <div className="flex items-center gap-2 mb-2.5">
            {program.laz.logoUrl ? (
              <Image src={program.laz.logoUrl} alt={program.laz.name} width={18} height={18} className="rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-surface-muted text-primary flex items-center justify-center text-[9px] font-bold shadow-sm">
                {program.laz.name.charAt(0)}
              </div>
            )}
            <span className="text-xs font-medium text-secondary truncate">
              Oleh <span className="font-semibold text-primary">{program.laz.name}</span>
            </span>
          </div>
        )}
        <h3 className="text-lg font-bold text-primary line-clamp-2 mb-2 leading-snug group-hover:text-success transition-colors">
          {program.title}
        </h3>
        <p className="text-sm text-secondary line-clamp-2 mb-5 leading-relaxed">
          {program.description}
        </p>
        <div className="mt-auto pt-4 border-t border-border/40">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[11px] text-secondary mb-0.5 font-medium uppercase tracking-wide">Terkumpul</p>
              <p className="text-sm font-bold text-brand-primary">{formatRupiah(currentNum)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-secondary mb-0.5 font-medium uppercase tracking-wide">Sisa Waktu</p>
              <p className="text-xs font-semibold text-primary">{daysRemainingText}</p>
            </div>
          </div>
          <div className="w-full bg-surface-soft rounded-full h-1.5 mb-2 overflow-hidden">
            <div
              className="bg-success h-full rounded-full transition-all duration-500"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-medium text-secondary">
            <span>{safeProgress}% Tercapai</span>
            <span>Target: {formatRupiah(targetNum)}</span>
          </div>
          <div className="mt-4 text-center text-xs font-bold text-brand-primary group-hover:text-success transition-colors flex items-center justify-center gap-1">
            Lihat Detail & Donasi &rarr;
          </div>
        </div>
      </div>
    </Link>
  );
}
