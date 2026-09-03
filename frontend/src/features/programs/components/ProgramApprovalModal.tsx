import type { Prisma } from "@prisma/client";
import { Button, Badge } from "@/components/ui";
import { X } from "lucide-react";
import { formatProgramCategory } from "@/lib/program-category";

type ProgramWithRelations = Omit<
  Prisma.ProgramGetPayload<{
    include: { createdBy: { select: { name: true } }; lembaga: { select: { name: true; slug: true } } };
  }>,
  "targetAmount" | "currentAmount" | "distributedAmount"
> & {
  targetAmount: number;
  currentAmount: number;
  distributedAmount: number;
};

export function ProgramApprovalModal({
  program,
  onClose,
  onApprove,
  onReject,
}: {
  program: ProgramWithRelations;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const formatRupiah = (amount: number | string) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  const latestReview = (program as any).reviewHistory?.[0];
  const defaultPlatform = Number(latestReview?.defaultPlatformPercentage ?? program.amilPlatformPercentage);
  const requestedPlatform = latestReview?.requestedPlatformPercentage ?? (program as any).requestedAmilPlatformPercentage;
  const hasPlatformChange = requestedPlatform != null
    && Math.abs(Number(requestedPlatform) - defaultPlatform) > 1e-8;
  const reviewedPlatform = hasPlatformChange ? Number(requestedPlatform) : defaultPlatform;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl min-w-0 overflow-x-hidden overflow-y-auto rounded-2xl border border-border/40 bg-surface shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border/40">
          <h3 className="text-lg font-bold text-primary">Detail Pengajuan Program</h3>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            {program.imageUrl ? (
              <img
                src={program.imageUrl}
                alt={program.title}
                className="w-20 h-20 rounded-xl object-cover border border-border/40"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-surface-muted flex items-center justify-center font-bold text-primary border border-border/40">
                {program.title.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="break-words text-xl font-bold text-primary [overflow-wrap:anywhere]">{program.title}</p>
              <p className="break-words text-sm text-secondary [overflow-wrap:anywhere]">oleh {program.lembaga?.name ?? "-"}</p>
              <Badge intent="warning" className="mt-1">Menunggu Review</Badge>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-secondary font-medium">Kategori</dt>
              <dd className="text-primary font-semibold">{formatProgramCategory(program.category)}</dd>
            </div>
            <div>
              <dt className="text-secondary font-medium">Target Dana</dt>
              <dd className="text-primary font-semibold">{formatRupiah(program.targetAmount as any)}</dd>
            </div>
            <div>
              <dt className="text-secondary font-medium">Dibuat oleh</dt>
              <dd className="text-primary font-semibold">{program.createdBy?.name ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-secondary font-medium">Lembaga</dt>
              <dd className="text-primary font-semibold">{program.lembaga?.name ?? "-"}</dd>
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div><dt className="text-xs font-semibold text-emerald-700">AMIL LEMBAGA</dt><dd className="mt-1 text-lg font-black text-emerald-900">{Number(program.amilInstitutionPercentage).toFixed(2)}%</dd></div>
              <div><dt className="text-xs font-semibold text-amber-700">AMIL PLATFORM</dt><dd className="mt-1 text-lg font-black text-amber-900">{hasPlatformChange ? `${defaultPlatform.toFixed(2)}% → ${reviewedPlatform.toFixed(2)}%` : `${defaultPlatform.toFixed(2)}% (default)`}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-600">TOTAL / BATAS</dt><dd className="mt-1 text-lg font-black text-slate-800">{(Number(program.amilInstitutionPercentage) + reviewedPlatform).toFixed(2)}% / {Number(program.amilMaxTotalPercentage).toFixed(2)}%</dd></div>
            </div>
            {hasPlatformChange && (latestReview?.platformChangeReason ?? (program as any).amilPlatformChangeReason) && (
              <div className="min-w-0 sm:col-span-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <dt className="text-xs font-semibold uppercase text-blue-700">Alasan Perubahan Amil Platform</dt>
                <dd className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-white/60 p-3 text-sm leading-6 text-blue-900 [overflow-wrap:anywhere]">
                  {latestReview?.platformChangeReason ?? (program as any).amilPlatformChangeReason}
                </dd>
              </div>
            )}
            {program.startDate && (
              <div>
                <dt className="text-secondary font-medium">Tanggal Mulai</dt>
                <dd className="text-primary font-semibold">
                  {new Date(program.startDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                </dd>
              </div>
            )}
            {program.endDate && (
              <div>
                <dt className="text-secondary font-medium">Tanggal Berakhir</dt>
                <dd className="text-primary font-semibold">
                  {new Date(program.endDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                </dd>
              </div>
            )}
            <div className="min-w-0 sm:col-span-2">
              <dt className="text-secondary font-medium">Deskripsi</dt>
              <dd className="break-words whitespace-pre-wrap text-primary [overflow-wrap:anywhere]">{program.description}</dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border/40">
          <Button intent="destructive" onClick={onReject}>Tolak</Button>
          <Button intent="primary" onClick={onApprove}>Setujui Program &amp; Porsi Amil</Button>
        </div>
      </div>
    </div>
  );
}
