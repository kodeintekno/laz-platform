import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { api, asAction } from "@/lib/api-client";
import { Badge, Button, EmptyState, PageHeader, Pagination, Select, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { toast } from "@/stores/toast.store";

const STATUS_META: Record<string, { label: string; intent: "success" | "warning" | "destructive" }> = {
  PENDING: { label: "Menunggu", intent: "warning" },
  APPROVED: { label: "Disetujui", intent: "success" },
  REJECTED: { label: "Ditolak", intent: "destructive" },
};

export function PlatformAmilRequestsPage() {
  const [searchParams] = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? "PENDING";

  const { data: result, isLoading } = useQuery({
    queryKey: ["amil-platform-change-requests", { page, limit, search, status }],
    queryFn: () => api.get<any[]>("/amil/platform-change-requests", { page, limit, search, status: status === "ALL" ? undefined : status }),
  });
  const requests = result?.data ?? [];
  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["amil-platform-change-requests"] });

  const approve = async (id: string) => {
    setProcessingId(id);
    const response = await asAction(api.patch(`/amil/platform-change-requests/${id}/approve`, {}));
    setProcessingId(null);
    if (response.error) return toast.error(response.error);
    toast.success("Permohonan disetujui dan porsi platform lembaga telah diperbarui");
    invalidate();
  };

  const reject = async () => {
    if (!rejectingId || reviewNote.trim().length < 5) return;
    setProcessingId(rejectingId);
    const response = await asAction(api.patch(`/amil/platform-change-requests/${rejectingId}/reject`, { reviewNote }));
    setProcessingId(null);
    if (response.error) return toast.error(response.error);
    toast.success("Permohonan ditolak");
    setRejectingId(null);
    setReviewNote("");
    invalidate();
  };

  const setStatus = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("status", value); else params.delete("status");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permohonan Porsi Amil Platform"
        description="Tinjau permohonan perubahan porsi platform yang diajukan lembaga saat membuat program."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><Clock3 className="h-5 w-5 text-amber-600" /><span className="text-sm text-amber-900">Permohonan baru perlu keputusan Super Admin</span></div>
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><span className="text-sm text-emerald-900">Persetujuan langsung mengubah porsi lembaga</span></div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><XCircle className="h-5 w-5 text-slate-500" /><span className="text-sm text-slate-700">Penolakan wajib disertai alasan</span></div>
      </div>

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari lembaga, program, atau alasan..."
        filterSlot={
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-auto">
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </Select>
        }
      />

      {isLoading ? (
        <TableSkeleton headers={["Lembaga / Program", "Kategori", "Perubahan", "Alasan", "Status", "Aksi"]} rowCount={limit} columnTypes={["text", "text", "text", "text", "text", "action"]} />
      ) : requests.length === 0 ? (
        <EmptyState title="Tidak Ada Permohonan" description="Belum ada permohonan porsi platform untuk filter yang dipilih." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/40 bg-surface shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/40 bg-surface-soft text-xs uppercase tracking-wide text-secondary">
              <tr><th className="p-4">Lembaga / Program</th><th className="p-4">Kategori</th><th className="p-4">Perubahan</th><th className="p-4">Alasan</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {requests.map((request: any) => {
                const meta = STATUS_META[request.status] ?? STATUS_META.PENDING;
                return (
                  <tr key={request.id} className="align-top hover:bg-surface-soft/60">
                    <td className="p-4">
                      <p className="font-semibold text-primary">{request.lembaga?.name}</p>
                      <p className="mt-1 max-w-56 text-xs text-secondary">{request.program?.title ?? "Pengajuan langsung dari lembaga"}</p>
                      <p className="mt-1 text-[11px] text-muted">{new Date(request.createdAt).toLocaleString("id-ID")}</p>
                    </td>
                    <td className="p-4 font-semibold text-primary">{request.category}</td>
                    <td className="p-4">
                      <p className="font-bold text-primary">{Number(request.currentPlatformPercentage).toFixed(2)}% → {Number(request.requestedPlatformPercentage).toFixed(2)}%</p>
                      <p className="mt-1 text-xs text-secondary">Porsi lembaga saat diajukan: {Number(request.institutionPercentage).toFixed(2)}%</p>
                    </td>
                    <td className="p-4"><p className="max-w-72 whitespace-pre-line text-secondary">{request.reason}</p>{request.reviewNote && <p className="mt-2 text-xs font-medium text-primary">Catatan review: {request.reviewNote}</p>}</td>
                    <td className="p-4"><Badge intent={meta.intent}>{meta.label}</Badge></td>
                    <td className="p-4 text-right">
                      {request.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => approve(request.id)} disabled={processingId === request.id}>Setujui</Button>
                          <Button size="sm" intent="destructive" onClick={() => { setRejectingId(request.id); setReviewNote(""); }} disabled={processingId === request.id}>Tolak</Button>
                        </div>
                      ) : <span className="text-xs text-muted">{request.reviewedBy?.name ?? "Super Admin"}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && requests.length > 0 && <Pagination {...pagination} />}

      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/40 bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-primary">Tolak Permohonan</h3>
            <p className="text-sm text-secondary">Berikan alasan yang dapat dibaca oleh lembaga.</p>
            <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={4} placeholder="Alasan penolakan..." className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary" />
            <div className="flex justify-end gap-3">
              <Button intent="secondary" onClick={() => { setRejectingId(null); setReviewNote(""); }} disabled={!!processingId}>Batal</Button>
              <Button intent="destructive" onClick={reject} disabled={reviewNote.trim().length < 5 || !!processingId} isLoading={!!processingId}>Tolak Permohonan</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
