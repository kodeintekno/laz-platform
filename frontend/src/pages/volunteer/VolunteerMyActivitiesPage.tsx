import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Badge, Button, Textarea, EmptyState } from "@/components/ui";
import { FileUpload } from "@/components/ui/FileUpload";
import { toast } from "@/stores/toast.store";

const STATUS_META: Record<string, { label: string; intent: "success" | "warning" | "destructive" }> = {
  APPROVED: { label: "Sedang Diikuti", intent: "success" },
  REPORT_SUBMITTED: { label: "Menunggu Verifikasi Laporan", intent: "warning" },
};

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d));

function ReportForm({ applicationId, onSubmitted }: { applicationId: string; onSubmitted: () => void }) {
  const [reportText, setReportText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [filePublicId, setFilePublicId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (reportText.trim().length < 10) {
      toast.error("Laporan minimal 10 karakter");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/volunteers/applications/${applicationId}/report`, {
        reportText,
        reportFileUrl: fileUrl || undefined,
        reportFilePublicId: filePublicId || undefined,
      });
      toast.success("Laporan berhasil dikirim! Menunggu verifikasi lembaga.");
      onSubmitted();
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal mengirim laporan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
      <p className="text-sm font-semibold text-primary">Kirim Laporan / Tugas Selesai</p>
      <Textarea
        placeholder="Ceritakan apa yang telah Anda kerjakan pada kegiatan ini..."
        value={reportText}
        onChange={(e) => setReportText(e.target.value)}
        rows={4}
        disabled={submitting}
      />
      <FileUpload
        name={`report-file-${applicationId}`}
        label="Lampiran (Opsional)"
        accept="image/png, image/jpeg, application/pdf"
        description="Foto dokumentasi atau file pendukung laporan (Opsional, max 2 MB)"
        folder="volunteer-reports"
        disabled={submitting}
        onUpload={(payload) => {
          setFileUrl(payload.url);
          setFilePublicId(payload.publicId);
        }}
        onRemove={() => {
          setFileUrl("");
          setFilePublicId("");
        }}
      />
      <Button onClick={handleSubmit} isLoading={submitting} disabled={submitting}>
        Kirim Laporan
      </Button>
    </div>
  );
}

export function VolunteerMyActivitiesPage() {
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ["volunteer", "applications", "active"],
    queryFn: () => api.get<any[]>("/volunteers/applications", { scope: "active" }),
  });

  const applications = result?.data ?? [];

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["volunteer", "applications"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Kegiatan Saya</h1>
        <p className="text-secondary mt-1">Kegiatan yang sedang Anda ikuti. Kirim laporan setelah tugas selesai.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-secondary">Memuat...</p>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app: any) => {
            const meta = STATUS_META[app.status] ?? { label: app.status, intent: "warning" as const };
            return (
              <div key={app.id} className="bg-surface rounded-2xl border border-border/40 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-primary">{app.activity?.title}</p>
                    <p className="text-xs text-secondary">
                      {app.lembaga?.name}
                      {app.activity?.location ? ` · ${app.activity.location}` : ""}
                    </p>
                    {app.activity?.activityDate && (
                      <p className="text-xs text-secondary">🗓️ {fmtDate(app.activity.activityDate)}</p>
                    )}
                  </div>
                  <Badge intent={meta.intent}>{meta.label}</Badge>
                </div>

                {app.status === "APPROVED" && (
                  <ReportForm applicationId={app.id} onSubmitted={refetch} />
                )}

                {app.status === "REPORT_SUBMITTED" && app.reportText && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <p className="text-sm font-semibold text-primary mb-1">Laporan Anda:</p>
                    <p className="text-sm text-secondary whitespace-pre-line">{app.reportText}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Belum Ada Kegiatan yang Diikuti"
          description="Kegiatan yang disetujui oleh lembaga akan muncul di sini."
        />
      )}
    </div>
  );
}
