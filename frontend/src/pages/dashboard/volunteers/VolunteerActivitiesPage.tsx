import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api, asAction } from "@/lib/api-client";
import {
  PageHeader,
  Badge,
  Button,
  TableSkeleton,
  EmptyState,
  Dialog,
  Input,
  Textarea,
  Select,
  ConfirmDialog,
} from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { toast } from "@/stores/toast.store";

const STATUS_META: Record<string, { label: string; intent: "success" | "warning" | "destructive" }> = {
  OPEN: { label: "Terbuka", intent: "success" },
  CLOSED: { label: "Ditutup", intent: "warning" },
  CANCELLED: { label: "Dibatalkan", intent: "destructive" },
};

const STATUS_OPTIONS = ["OPEN", "CLOSED", "CANCELLED"] as const;

interface ActivityFormState {
  title: string;
  description: string;
  location: string;
  activityDate: string;
  quota: string;
  programId: string;
  status: (typeof STATUS_OPTIONS)[number];
}

const EMPTY_FORM: ActivityFormState = {
  title: "",
  description: "",
  location: "",
  activityDate: "",
  quota: "",
  programId: "",
  status: "OPEN",
};

export function VolunteerActivitiesPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ActivityFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: result, isLoading } = useQuery({
    queryKey: ["volunteer-activities", { page, limit, search }],
    queryFn: () => api.get<any[]>("/lembaga/volunteer-activities", { page, limit, search }),
  });

  const { data: programsResult } = useQuery({
    queryKey: ["programs", "options-for-activity"],
    queryFn: () => api.get<any[]>("/programs", { limit: 100 }),
  });

  const activities = result?.data ?? [];
  const programs = programsResult?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["volunteer-activities"] });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (activity: any) => {
    setEditingId(activity.id);
    setForm({
      title: activity.title,
      description: activity.description,
      location: activity.location ?? "",
      activityDate: activity.activityDate ? new Date(activity.activityDate).toISOString().split("T")[0] : "",
      quota: activity.quota != null ? String(activity.quota) : "",
      programId: activity.programId ?? "",
      status: activity.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (form.title.trim().length < 5) {
      toast.error("Judul minimal 5 karakter");
      return;
    }
    if (form.description.trim().length < 20) {
      toast.error("Deskripsi minimal 20 karakter");
      return;
    }
    setSubmitting(true);
    const body = {
      title: form.title,
      description: form.description,
      location: form.location || undefined,
      activityDate: form.activityDate || undefined,
      quota: form.quota ? Number(form.quota) : undefined,
      programId: form.programId || undefined,
      status: form.status,
    };

    const action = editingId
      ? asAction(api.patch(`/lembaga/volunteer-activities/${editingId}`, body))
      : asAction(api.post("/lembaga/volunteer-activities", body));

    const res = await action;
    setSubmitting(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(editingId ? "Kegiatan berhasil diperbarui" : "Kegiatan berhasil dibuat");
    setDialogOpen(false);
    invalidate();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const res = await asAction(api.delete(`/lembaga/volunteer-activities/${deletingId}`));
    if (res.error) toast.error(res.error);
    else {
      toast.success("Kegiatan berhasil dihapus");
      invalidate();
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kegiatan Relawan"
        description="Kelola kegiatan yang membuka pendaftaran relawan untuk lembaga Anda."
        action={<Button intent="primary" onClick={openCreate}>Buat Kegiatan</Button>}
      />

      <DataTableToolbar searchValue={search} searchPlaceholder="Cari judul atau deskripsi kegiatan..." />

      {isLoading ? (
        <TableSkeleton headers={["Kegiatan", "Kuota", "Status", "Aksi"]} rowCount={limit} columnTypes={["text", "text", "text", "action"]} />
      ) : activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity: any) => {
            const meta = STATUS_META[activity.status] ?? { label: activity.status, intent: "warning" as const };
            return (
              <div key={activity.id} className="bg-surface rounded-2xl border border-border/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-primary">{activity.title}</p>
                  <p className="text-xs text-secondary">
                    {activity.location ?? "Lokasi belum diisi"}
                    {activity.program?.title ? ` · Program: ${activity.program.title}` : ""}
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    {activity._count?.applications ?? 0}{activity.quota ? `/${activity.quota}` : ""} pendaftar
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge intent={meta.intent}>{meta.label}</Badge>
                  <Button size="sm" intent="secondary" onClick={() => openEdit(activity)}>Edit</Button>
                  <Button size="sm" intent="destructive" onClick={() => setDeletingId(activity.id)}>Hapus</Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Belum Ada Kegiatan"
          description="Buat kegiatan relawan pertama untuk lembaga Anda."
          actionText="Buat Kegiatan"
          onAction={openCreate}
        />
      )}

      <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? "Edit Kegiatan" : "Buat Kegiatan Baru"}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-primary mb-1 block">Judul Kegiatan</label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Mis. Distribusi Tangki Air Bersih" disabled={submitting} />
          </div>
          <div>
            <label className="text-sm font-semibold text-primary mb-1 block">Deskripsi</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Jelaskan kegiatan ini..." disabled={submitting} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-primary mb-1 block">Lokasi (Opsional)</label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Mis. Desa Sukamaju" disabled={submitting} />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary mb-1 block">Tanggal Kegiatan (Opsional)</label>
              <Input type="date" value={form.activityDate} onChange={(e) => setForm((f) => ({ ...f, activityDate: e.target.value }))} disabled={submitting} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-primary mb-1 block">Kuota Relawan (Opsional)</label>
              <Input type="number" min={1} value={form.quota} onChange={(e) => setForm((f) => ({ ...f, quota: e.target.value }))} placeholder="Tanpa batas" disabled={submitting} />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary mb-1 block">Status</label>
              <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ActivityFormState["status"] }))} disabled={submitting}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-primary mb-1 block">Kaitkan dengan Program (Opsional)</label>
            <Select value={form.programId} onChange={(e) => setForm((f) => ({ ...f, programId: e.target.value }))} disabled={submitting}>
              <option value="">Tidak dikaitkan dengan program manapun</option>
              {programs.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button intent="secondary" onClick={() => setDialogOpen(false)} disabled={submitting}>Batal</Button>
            <Button onClick={handleSubmit} isLoading={submitting} disabled={submitting}>
              {editingId ? "Simpan Perubahan" : "Buat Kegiatan"}
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Kegiatan"
        message="Apakah Anda yakin ingin menghapus kegiatan ini? Pendaftaran relawan yang terkait juga akan terhapus."
        confirmText="Hapus"
        cancelText="Batal"
        intent="destructive"
      />
    </div>
  );
}
