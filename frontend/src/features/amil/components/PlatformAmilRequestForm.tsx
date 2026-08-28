import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock3, Send, XCircle } from "lucide-react";
import { api, asAction } from "@/lib/api-client";
import { Badge, Button, Select } from "@/components/ui";
import { getMyInstitutionAmilSettings } from "../actions/amil.actions";
import { toast } from "@/stores/toast.store";

type AmilSetting = {
  category: string;
  maxTotalPercentage: number;
  platformPercentage: number;
  institutionPercentage: number;
};

const STATUS_META: Record<string, { label: string; intent: "success" | "warning" | "destructive" }> = {
  PENDING: { label: "Menunggu", intent: "warning" },
  APPROVED: { label: "Disetujui", intent: "success" },
  REJECTED: { label: "Ditolak", intent: "destructive" },
};

function hasAtMostTwoDecimals(value: number) {
  return Math.abs(value * 100 - Math.round(value * 100)) < Number.EPSILON * 100;
}

export function PlatformAmilRequestForm() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [requestedPercentage, setRequestedPercentage] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: settingsResult, isLoading: settingsLoading } = useQuery({
    queryKey: ["myInstitutionAmilSettings"],
    queryFn: getMyInstitutionAmilSettings,
  });
  const { data: requestsResult, isLoading: requestsLoading } = useQuery({
    queryKey: ["myPlatformAmilChangeRequests"],
    queryFn: () => api.get<any[]>("/amil/my-platform-change-requests"),
  });

  const settings = (settingsResult?.data ?? []) as AmilSetting[];
  const requests = requestsResult?.data ?? [];
  const selected = useMemo(() => settings.find((item) => item.category === category), [settings, category]);
  const pendingRequest = requests.find((item: any) => item.category === category && item.status === "PENDING");

  useEffect(() => {
    if (!settings.length) return;
    if (!settings.some((item) => item.category === category)) setCategory(settings[0].category);
  }, [settings, category]);

  useEffect(() => {
    if (!selected) return;
    setRequestedPercentage(String(selected.platformPercentage));
    setReason("");
    setSubmitted(false);
  }, [selected?.category]);

  const requested = Number(requestedPercentage);
  const institution = Number(selected?.institutionPercentage ?? 0);
  const platform = Number(selected?.platformPercentage ?? 0);
  const maximum = Number(selected?.maxTotalPercentage ?? 0);
  const proposedTotal = institution + requested;
  const errors = {
    requestedPercentage: !requestedPercentage.trim()
      ? "Porsi platform yang diajukan wajib diisi"
      : !Number.isFinite(requested) || requested < 0 || requested > 100
        ? "Porsi platform harus berada di antara 0% dan 100%"
        : !hasAtMostTwoDecimals(requested)
          ? "Gunakan maksimal 2 angka desimal"
          : requested === platform
            ? "Porsi yang diajukan harus berbeda dari porsi saat ini"
            : proposedTotal > maximum
              ? `Total usulan tidak boleh melebihi ${maximum.toFixed(2)}%`
              : "",
    reason: reason.trim().length < 10
      ? "Alasan permohonan minimal 10 karakter"
      : reason.trim().length > 1000
        ? "Alasan permohonan maksimal 1000 karakter"
        : "",
  };
  const isValid = !!selected && !errors.requestedPercentage && !errors.reason && !pendingRequest;

  const mutation = useMutation({
    mutationFn: () => asAction(api.post("/amil/my-platform-change-requests", {
      category,
      requestedPlatformPercentage: requested,
      reason: reason.trim(),
    })),
    onSuccess: async (result) => {
      if (result.error) return toast.error(result.error);
      toast.success("Permohonan perubahan porsi platform berhasil dikirim");
      setReason("");
      setSubmitted(false);
      await queryClient.invalidateQueries({ queryKey: ["myPlatformAmilChangeRequests"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Gagal mengirim permohonan"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (isValid) mutation.mutate();
  };

  if (settingsLoading) return <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />;
  if (!settings.length) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Pengaturan amil lembaga belum tersedia. Hubungi administrator platform.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Perubahan yang disetujui menjadi default untuk program berikutnya. Snapshot program yang sudah dibuat atau dipublikasikan tidak berubah.
      </div>
      <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="amil-request-category" className="text-sm font-semibold text-slate-700">Kategori Dana</label>
          <div className="mt-2 max-w-xs">
            <Select
              id="amil-request-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              disabled={mutation.isPending}
              className="bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold focus:border-indigo-500 focus:ring-indigo-500/20"
            >
              {settings.map((setting) => <option key={setting.category} value={setting.category}>{setting.category}</option>)}
            </Select>
          </div>
        </div>

        {selected && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-semibold text-amber-700">PORSI PLATFORM SAAT INI</p><p className="mt-2 text-2xl font-black text-amber-900">{platform.toFixed(2)}%</p></div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-semibold text-emerald-700">PORSI LEMBAGA</p><p className="mt-2 text-2xl font-black text-emerald-900">{institution.toFixed(2)}%</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-600">BATAS TOTAL</p><p className="mt-2 text-2xl font-black text-slate-800">{maximum.toFixed(2)}%</p></div>
          </div>
        )}

        {pendingRequest && (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <Clock3 className="h-5 w-5 shrink-0" />
            <div><p className="font-semibold">Masih ada permohonan yang menunggu</p><p className="mt-1">Tunggu keputusan Super Admin sebelum mengajukan perubahan baru untuk kategori {category}.</p></div>
          </div>
        )}

        <div>
          <label htmlFor="requested-platform-percentage" className="text-sm font-semibold text-slate-700">Porsi Platform yang Diajukan</label>
          <div className="relative mt-2 max-w-xs">
            <input
              id="requested-platform-percentage"
              type="number"
              min={0}
              max={Math.max(0, maximum - institution)}
              step="0.01"
              value={requestedPercentage}
              onChange={(event) => setRequestedPercentage(event.target.value)}
              disabled={mutation.isPending || !!pendingRequest}
              aria-invalid={submitted && !!errors.requestedPercentage}
              className={`w-full rounded-xl border px-3 py-2.5 pr-9 outline-none focus:ring-2 ${submitted && errors.requestedPercentage ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
          </div>
          <p className={`mt-2 text-xs ${proposedTotal > maximum ? "font-medium text-red-600" : "text-slate-500"}`}>Total porsi setelah disetujui: {Number.isFinite(proposedTotal) ? proposedTotal.toFixed(2) : "-"}% dari batas {maximum.toFixed(2)}%.</p>
          {submitted && errors.requestedPercentage && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3.5 w-3.5" /> {errors.requestedPercentage}</p>}
        </div>

        <div>
          <label htmlFor="amil-request-reason" className="text-sm font-semibold text-slate-700">Alasan Permohonan</label>
          <textarea
            id="amil-request-reason"
            rows={5}
            maxLength={1000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={mutation.isPending || !!pendingRequest}
            placeholder="Jelaskan kebutuhan dan pertimbangan perubahan porsi amil platform..."
            aria-invalid={submitted && !!errors.reason}
            className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${submitted && errors.reason ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"}`}
          />
          <div className="mt-1 flex justify-between gap-3"><span>{submitted && errors.reason && <span className="text-xs font-medium text-red-600">{errors.reason}</span>}</span><span className="text-xs text-slate-400">{reason.length}/1000</span></div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <Button type="submit" disabled={mutation.isPending || !!pendingRequest} isLoading={mutation.isPending}>
            <Send className="mr-2 h-4 w-4" /> Kirim Permohonan
          </Button>
        </div>
      </form>

      <section className="space-y-3">
        <div><h2 className="text-lg font-bold text-slate-800">Riwayat Permohonan</h2><p className="text-sm text-slate-500">Status permohonan perubahan porsi platform lembaga Anda.</p></div>
        {requestsLoading ? <div className="h-24 animate-pulse rounded-xl bg-slate-100" /> : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">Belum ada permohonan perubahan porsi platform.</div>
        ) : requests.map((request: any) => {
          const meta = STATUS_META[request.status] ?? STATUS_META.PENDING;
          const StatusIcon = request.status === "APPROVED" ? CheckCircle2 : request.status === "REJECTED" ? XCircle : Clock3;
          return (
            <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="flex gap-3"><StatusIcon className="mt-0.5 h-5 w-5 text-slate-500" /><div><p className="font-semibold text-slate-800">{request.category}: {Number(request.currentPlatformPercentage).toFixed(2)}% → {Number(request.requestedPlatformPercentage).toFixed(2)}%</p><p className="mt-1 text-sm text-slate-600">{request.reason}</p><p className="mt-2 text-xs text-slate-400">{new Date(request.createdAt).toLocaleString("id-ID")}</p></div></div>
                <Badge intent={meta.intent}>{meta.label}</Badge>
              </div>
              {request.reviewNote && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><strong>Catatan Super Admin:</strong> {request.reviewNote}</p>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
