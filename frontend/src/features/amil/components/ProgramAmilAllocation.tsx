import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { AlertCircle, Building2, HandCoins } from "lucide-react";
import { getMyInstitutionAmilSettings } from "../actions/amil.actions";
import type { ProgramInput } from "@/features/programs/validations/programs.schema";
import type { Program } from "@prisma/client";
import { formatProgramCategory } from "@/lib/program-category";

type AmilSetting = {
  category: string;
  maxTotalPercentage: number;
  platformPercentage: number;
  institutionPercentage: number;
};

export function ProgramAmilAllocation({ initialData }: { initialData?: Program }) {
  const {
    register,
    control,
    setValue,
    trigger,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext<ProgramInput>();
  const category = useWatch({ control, name: "category" });
  const institutionPercentage = Number(useWatch({ control, name: "institutionPercentage" }) ?? 0);
  const requestedPlatformPercentage = Number(useWatch({ control, name: "requestedPlatformPercentage" }) ?? 0);
  const defaultPlatformValue = useWatch({ control, name: "amilPlatformPercentage" });
  const maximumValue = useWatch({ control, name: "amilMaxTotalPercentage" });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["myInstitutionAmilSettings"],
    queryFn: getMyInstitutionAmilSettings,
  });
  const settings = (data?.data ?? []) as AmilSetting[];
  const selected = useMemo(() => settings.find((item) => item.category === category), [settings, category]);
  const usesExistingSnapshot = !!initialData && category === initialData.category;
  const isLocked = !!initialData && (
    !!initialData.amilLockedAt || ["PUBLISHED", "COMPLETED", "CANCELLED"].includes(initialData.status)
  );

  useEffect(() => {
    if (usesExistingSnapshot && initialData) {
      const defaultPlatform = Number(initialData.amilPlatformPercentage);
      const requestedPlatform = initialData.requestedAmilPlatformPercentage == null
        ? defaultPlatform
        : Number(initialData.requestedAmilPlatformPercentage);
      setValue("institutionPercentage", Number(initialData.amilInstitutionPercentage), { shouldValidate: false });
      setValue("requestedPlatformPercentage", requestedPlatform, { shouldValidate: false });
      setValue("platformChangeReason", initialData.amilPlatformChangeReason ?? "", { shouldValidate: false });
      setValue("amilPlatformPercentage", defaultPlatform, { shouldValidate: false });
      setValue("amilMaxTotalPercentage", Number(initialData.amilMaxTotalPercentage), { shouldValidate: false });
      return;
    }
    if (selected) {
      setValue("institutionPercentage", Number(selected.institutionPercentage), { shouldValidate: false });
      setValue("requestedPlatformPercentage", Number(selected.platformPercentage), { shouldValidate: false });
      setValue("platformChangeReason", "", { shouldValidate: false });
      setValue("amilPlatformPercentage", Number(selected.platformPercentage), { shouldValidate: false });
      setValue("amilMaxTotalPercentage", Number(selected.maxTotalPercentage), { shouldValidate: false });
    }
  }, [category, selected?.category, usesExistingSnapshot, initialData?.id, setValue]);

  useEffect(() => {
    if (!selected && !usesExistingSnapshot) return;
    const hasInteractedWithAmil = isSubmitted
      || touchedFields.institutionPercentage
      || touchedFields.requestedPlatformPercentage
      || touchedFields.platformChangeReason;
    if (!hasInteractedWithAmil) return;
    // Tunggu React Hook Form menyimpan nilai input terbaru, lalu validasi ulang
    // kelompok field amil saja. Field program lain tidak boleh menampilkan error
    // sebelum pengguna menekan Simpan.
    const timer = window.setTimeout(() => {
      void trigger(["institutionPercentage", "requestedPlatformPercentage", "platformChangeReason"]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    institutionPercentage,
    requestedPlatformPercentage,
    selected?.category,
    usesExistingSnapshot,
    isSubmitted,
    touchedFields.institutionPercentage,
    touchedFields.requestedPlatformPercentage,
    touchedFields.platformChangeReason,
    trigger,
  ]);

  if (isLoading && !usesExistingSnapshot) {
    return <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />;
  }
  if ((!usesExistingSnapshot && isError) || (!usesExistingSnapshot && !selected)) {
    return (
      <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0" />
        Pengaturan porsi amil untuk kategori ini tidak dapat dimuat. Hubungi administrator platform.
      </div>
    );
  }

  const defaultPlatform = Number(defaultPlatformValue ?? (usesExistingSnapshot ? initialData?.amilPlatformPercentage : selected?.platformPercentage) ?? 0);
  const maximum = Number(maximumValue ?? (usesExistingSnapshot ? initialData?.amilMaxTotalPercentage : selected?.maxTotalPercentage) ?? 0);
  const platformMaximum = Math.max(0, maximum - institutionPercentage);
  const institutionMaximum = Math.max(0, maximum - requestedPlatformPercentage);
  const total = institutionPercentage + requestedPlatformPercentage;
  const requestsPlatformChange = Math.abs(requestedPlatformPercentage - defaultPlatform) > 1e-8;

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><HandCoins className="h-5 w-5" /></div>
        <div>
          <h2 className="font-bold text-slate-800">Porsi Amil &amp; Pengajuan Perubahan</h2>
          <p className="mt-1 text-sm text-slate-600">
            Tentukan porsi amil untuk program <strong>{formatProgramCategory(category)}</strong>. Jika porsi platform diubah dari default, usulannya akan direview bersamaan dengan program.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-white p-4">
          <label htmlFor="institutionPercentage" className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Porsi Amil Lembaga
          </label>
          <div className="relative mt-2">
            <input
              id="institutionPercentage"
              type="number"
              min={0}
              max={institutionMaximum}
              step="0.01"
              disabled={isLocked}
              {...register("institutionPercentage", { valueAsNumber: true })}
              aria-invalid={!!errors.institutionPercentage}
              className={`w-full rounded-lg border bg-slate-50 px-3 py-2 pr-9 font-semibold outline-none focus:ring-2 ${errors.institutionPercentage ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Maksimal {institutionMaximum.toFixed(2)}% dengan usulan platform saat ini.</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <label htmlFor="requestedPlatformPercentage" className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Porsi Amil Platform
          </label>
          <div className="relative mt-2">
            <Controller
              name="requestedPlatformPercentage"
              control={control}
              render={({ field }) => (
                <input
                  id="requestedPlatformPercentage"
                  name={field.name}
                  ref={field.ref}
                  type="number"
                  min={0}
                  max={platformMaximum}
                  step="0.01"
                  disabled={isLocked}
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(
                    event.currentTarget.value === "" ? undefined : event.currentTarget.valueAsNumber,
                  )}
                  aria-invalid={!!errors.requestedPlatformPercentage}
                  className={`w-full rounded-lg border bg-slate-50 px-3 py-2 pr-9 font-semibold outline-none focus:ring-2 ${errors.requestedPlatformPercentage ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"}`}
                />
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Default saat ini {defaultPlatform.toFixed(2)}%.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Total Porsi Amil</p>
          <p className={`mt-3 text-2xl font-black ${total > maximum ? "text-red-600" : "text-slate-800"}`}>{total.toFixed(2)}%</p>
          <p className="mt-1 text-xs text-slate-500">Batas maksimum {maximum.toFixed(2)}%.</p>
        </div>
      </div>

      {errors.institutionPercentage?.message && <p className="text-xs font-medium text-red-600">{String(errors.institutionPercentage.message)}</p>}
      {errors.requestedPlatformPercentage?.message && <p className="text-xs font-medium text-red-600">{String(errors.requestedPlatformPercentage.message)}</p>}
      {total > maximum && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> Total porsi amil {total.toFixed(2)}% melebihi batas maksimum {maximum.toFixed(2)}%.
        </div>
      )}

      {requestsPlatformChange ? (
        <div className="min-w-0 space-y-3 overflow-hidden rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div>
            <p className="font-semibold text-blue-900">Perubahan {defaultPlatform.toFixed(2)}% → {requestedPlatformPercentage.toFixed(2)}% akan diajukan</p>
            <p className="mt-1 text-sm text-blue-700">Super Admin akan menyetujui atau menolak usulan ini sekaligus dengan pengajuan program.</p>
          </div>
          <div>
            <label htmlFor="platformChangeReason" className="text-sm font-semibold text-blue-900">Alasan perubahan</label>
            <textarea
              id="platformChangeReason"
              rows={3}
              disabled={isLocked}
              {...register("platformChangeReason")}
              className={`mt-1 w-full max-w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${errors.platformChangeReason ? "border-red-400 focus:ring-red-500/20" : "border-blue-200 focus:ring-blue-500/20"}`}
              placeholder="Jelaskan alasan pengajuan perubahan porsi amil platform (minimal 10 karakter)."
            />
            {errors.platformChangeReason?.message && <p className="mt-1 text-xs font-medium text-red-600">{String(errors.platformChangeReason.message)}</p>}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Program ini memakai default porsi amil platform {defaultPlatform.toFixed(2)}%; tidak ada pengajuan perubahan.
        </div>
      )}

      {isLocked && (
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700">
          <strong>Snapshot amil terkunci.</strong> Program sudah pernah dipublikasikan sehingga kategori dan persentasenya tidak dapat diubah.
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Building2 className="h-4 w-4" /> Porsi yang disetujui hanya berlaku untuk program ini dan disimpan pada setiap transaksi donasi.
      </div>
    </section>
  );
}
