import { Badge, Button } from "@/components/ui";
import { X } from "lucide-react";

type ReviewHistory = {
  id: string;
  status: string;
  defaultPlatformPercentage: number | string;
  requestedPlatformPercentage?: number | string | null;
  institutionPercentage: number | string;
  maxTotalPercentage: number | string;
  platformChangeReason?: string | null;
  rejectionReason?: string | null;
  submittedAt: Date | string;
  reviewedAt?: Date | string | null;
};

const REVIEW_STATUS: Record<string, { label: string; intent: "success" | "warning" | "destructive" | "muted" }> = {
  PENDING: { label: "Menunggu Review", intent: "warning" },
  APPROVED: { label: "Disetujui", intent: "success" },
  REJECTED: { label: "Ditolak", intent: "destructive" },
  WITHDRAWN: { label: "Ditarik ke Draft", intent: "muted" },
};

export function ProgramReviewHistoryModal({
  program,
  onClose,
}: {
  program: { title: string; reviewHistory?: ReviewHistory[] };
  onClose: () => void;
}) {
  const history = program.reviewHistory ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl min-w-0 overflow-x-hidden overflow-y-auto rounded-2xl border border-border/40 bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border/40 p-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-primary">Riwayat Pengajuan Program</h3>
            <p className="mt-1 break-words text-sm text-secondary [overflow-wrap:anywhere]">{program.title}</p>
          </div>
          <button type="button" onClick={onClose} className="text-secondary hover:text-primary" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-secondary">
              Program ini belum pernah diajukan untuk direview.
            </div>
          ) : history.map((review, index) => {
            const meta = REVIEW_STATUS[review.status] ?? { label: review.status, intent: "muted" as const };
            const requested = review.requestedPlatformPercentage;
            const hasPlatformChange = requested != null
              && Math.abs(Number(requested) - Number(review.defaultPlatformPercentage)) > 1e-8;
            return (
              <article key={review.id} className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">Pengajuan #{history.length - index}</span>
                    <Badge intent={meta.intent}>{meta.label}</Badge>
                  </div>
                  <time className="text-xs text-secondary">
                    {new Date(review.submittedAt).toLocaleString("id-ID")}
                  </time>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-secondary">Amil Lembaga</p>
                    <p className="mt-1 font-bold text-primary">{Number(review.institutionPercentage).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-secondary">Amil Platform</p>
                    <p className="mt-1 font-bold text-primary">
                      {hasPlatformChange
                        ? `${Number(review.defaultPlatformPercentage).toFixed(2)}% → ${Number(requested).toFixed(2)}%`
                        : `${Number(review.defaultPlatformPercentage).toFixed(2)}% (default)`
                    }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-secondary">Batas Total</p>
                    <p className="mt-1 font-bold text-primary">{Number(review.maxTotalPercentage).toFixed(2)}%</p>
                  </div>
                </div>

                {hasPlatformChange && review.platformChangeReason && (
                  <div className="mt-3 min-w-0 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                    <p className="font-semibold">Alasan perubahan amil platform</p>
                    <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words leading-6 [overflow-wrap:anywhere]">{review.platformChangeReason}</p>
                  </div>
                )}
                {review.status === "REJECTED" && review.rejectionReason && (
                  <div className="mt-3 min-w-0 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <p className="font-semibold">Alasan penolakan</p>
                    <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words leading-6 [overflow-wrap:anywhere]">{review.rejectionReason}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="flex justify-end border-t border-border/40 p-6">
          <Button intent="secondary" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </div>
  );
}
