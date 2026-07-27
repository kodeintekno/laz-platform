import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useRouter, usePathname } from "next/navigation";
import { api, asAction } from "@/lib/api-client";
import { PageHeader, Badge, Button, TableSkeleton, EmptyState, Select } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { toast } from "@/stores/toast.store";

const STATUS_META: Record<string, { label: string; intent: "success" | "warning" | "destructive" }> = {
  PENDING: { label: "Menunggu Persetujuan", intent: "warning" },
  APPROVED: { label: "Disetujui", intent: "success" },
  REJECTED: { label: "Ditolak", intent: "destructive" },
  REPORT_SUBMITTED: { label: "Menunggu Verifikasi Laporan", intent: "warning" },
  COMPLETED: { label: "Selesai", intent: "success" },
};

export function VolunteerApplicationsPage() {
  const [searchParams] = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const activityId = searchParams.get("activityId") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["volunteer-applications", { page, limit, search, activityId }],
    queryFn: () => api.get<any[]>("/lembaga/volunteer-applications", { page, limit, search, activityId }),
  });

  const { data: activitiesResult } = useQuery({
    queryKey: ["volunteer-activities", "options"],
    queryFn: () => api.get<any[]>("/lembaga/volunteer-activities", { limit: 100 }),
  });

  const applications = result?.data ?? [];
  const activities = activitiesResult?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["volunteer-applications"] });

  const handleApprove = async (id: string) => {
    const res = await asAction(api.patch(`/lembaga/volunteer-applications/${id}/approve`));
    if (res.error) toast.error(res.error);
    else {
      toast.success("Pendaftaran relawan disetujui");
      invalidate();
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    const res = await asAction(api.patch(`/lembaga/volunteer-applications/${id}/reject`, { reason: rejectReason }));
    if (res.error) toast.error(res.error);
    else {
      toast.success("Pendaftaran relawan ditolak");
      invalidate();
    }
    setRejectingId(null);
    setRejectReason("");
  };

  const handleVerify = async (id: string) => {
    const res = await asAction(api.patch(`/lembaga/volunteer-applications/${id}/verify`, {}));
    if (res.error) toast.error(res.error);
    else {
      toast.success("Laporan diverifikasi — kegiatan selesai untuk relawan ini");
      invalidate();
    }
  };

  const handleRequestRevision = async (id: string) => {
    const res = await asAction(api.patch(`/lembaga/volunteer-applications/${id}/request-revision`, { note: revisionNote || undefined }));
    if (res.error) toast.error(res.error);
    else {
      toast.success("Relawan diminta merevisi laporan");
      invalidate();
    }
    setRevisingId(null);
    setRevisionNote("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pendaftaran Relawan"
        description="Kelola pendaftaran relawan dan verifikasi laporan kegiatan lembaga Anda."
      />

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari nama, email, atau telepon relawan..."
        filterSlot={
          activities.length > 0 ? (
            <Select
              value={activityId ?? ""}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set("activityId", e.target.value);
                else params.delete("activityId");
                params.set("page", "1");
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="w-auto"
            >
              <option value="">Semua Kegiatan</option>
              {activities.map((a: any) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </Select>
          ) : undefined
        }
      />

      {isLoading ? (
        <TableSkeleton headers={["Relawan", "Kegiatan", "Status", "Aksi"]} rowCount={limit} columnTypes={["text", "text", "text", "action"]} />
      ) : applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map((app: any) => {
            const meta = STATUS_META[app.status] ?? { label: app.status, intent: "warning" as const };
            return (
              <div key={app.id} className="bg-surface rounded-2xl border border-border/40 p-5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-primary">{app.volunteer?.name}</p>
                    <p className="text-xs text-secondary">{app.volunteer?.email} &middot; {app.volunteer?.phone}</p>
                    <p className="text-sm text-secondary mt-1">Kegiatan: <span className="font-semibold text-primary">{app.activity?.title}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge intent={meta.intent}>{meta.label}</Badge>
                    {app.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm" intent="primary" onClick={() => handleApprove(app.id)}>Setujui</Button>
                        <Button size="sm" intent="destructive" onClick={() => setRejectingId(app.id)}>Tolak</Button>
                      </div>
                    )}
                    {app.status === "REPORT_SUBMITTED" && (
                      <div className="flex gap-2">
                        <Button size="sm" intent="primary" onClick={() => handleVerify(app.id)}>Verifikasi Laporan</Button>
                        <Button size="sm" intent="secondary" onClick={() => setRevisingId(app.id)}>Minta Revisi</Button>
                      </div>
                    )}
                  </div>
                </div>

                {app.status === "REPORT_SUBMITTED" && app.reportText && (
                  <div className="pt-3 border-t border-border/30">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1">Laporan Relawan</p>
                    <p className="text-sm text-primary whitespace-pre-line">{app.reportText}</p>
                    {app.reportFileUrl && (
                      <a href={app.reportFileUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-primary font-semibold hover:underline mt-1 inline-block">
                        Lihat lampiran
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Belum Ada Pendaftaran Relawan" description="Belum ada relawan yang mendaftar ke kegiatan lembaga Anda." />
      )}

      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-2xl shadow-xl border border-border/40 p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-primary">Tolak Pendaftaran Relawan</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Alasan penolakan..."
              className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectingId(null); setRejectReason(""); }} className="px-4 py-2 text-sm font-semibold text-secondary hover:text-primary transition">
                Batal
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-destructive text-white hover:bg-destructive/90 transition disabled:opacity-50"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {revisingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-2xl shadow-xl border border-border/40 p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-primary">Minta Revisi Laporan</h3>
            <textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              rows={3}
              placeholder="Catatan untuk relawan (opsional)..."
              className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRevisingId(null); setRevisionNote(""); }} className="px-4 py-2 text-sm font-semibold text-secondary hover:text-primary transition">
                Batal
              </button>
              <button
                onClick={() => handleRequestRevision(revisingId)}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 transition"
              >
                Minta Revisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
