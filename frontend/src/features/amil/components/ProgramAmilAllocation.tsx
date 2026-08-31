import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormContext, useWatch } from "react-hook-form";
import Link from "next/link";
import { AlertCircle, ArrowRight, Building2, HandCoins } from "lucide-react";
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
  const { register, control, setValue, trigger, formState: { errors } } = useFormContext<ProgramInput>();
  const category = useWatch({ control, name: "category" });
  const institutionPercentage = Number(useWatch({ control, name: "institutionPercentage" }) ?? 0);
  const snapshotPlatform = useWatch({ control, name: "amilPlatformPercentage" });
  const snapshotMaximum = useWatch({ control, name: "amilMaxTotalPercentage" });

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
      setValue("institutionPercentage", Number(initialData.amilInstitutionPercentage), { shouldValidate: true });
      setValue("amilPlatformPercentage", Number(initialData.amilPlatformPercentage), { shouldValidate: true });
      setValue("amilMaxTotalPercentage", Number(initialData.amilMaxTotalPercentage), { shouldValidate: true });
      return;
    }
    if (selected) {
      setValue("institutionPercentage", Number(selected.institutionPercentage), { shouldValidate: true });
      setValue("amilPlatformPercentage", Number(selected.platformPercentage), { shouldValidate: true });
      setValue("amilMaxTotalPercentage", Number(selected.maxTotalPercentage), { shouldValidate: true });
    }
  }, [category, selected?.category, usesExistingSnapshot, initialData, setValue]);

  useEffect(() => {
    if (!selected && !usesExistingSnapshot) return;
    void trigger("institutionPercentage");
  }, [institutionPercentage, selected, usesExistingSnapshot, trigger]);

  if (isLoading && !usesExistingSnapshot) {
    return <div className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />;
  }
  if ((!usesExistingSnapshot && isError) || (!usesExistingSnapshot && !selected)) {
    return (
      <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0" />
        Pengaturan porsi amil untuk kategori ini tidak dapat dimuat. Hubungi administrator platform.
      </div>
    );
  }

  const platform = Number(snapshotPlatform ?? (usesExistingSnapshot ? initialData?.amilPlatformPercentage : selected?.platformPercentage) ?? 0);
  const maximum = Number(snapshotMaximum ?? (usesExistingSnapshot ? initialData?.amilMaxTotalPercentage : selected?.maxTotalPercentage) ?? 0);
  const institutionMaximum = Math.max(0, maximum - platform);
  const total = institutionPercentage + platform;

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><HandCoins className="h-5 w-5" /></div>
        <div>
          <h2 className="font-bold text-slate-800">Porsi Amil Program</h2>
          <p className="mt-1 text-sm text-slate-600">
            Porsi ini disimpan khusus untuk program <strong>{formatProgramCategory(category)}</strong> ini. Perubahan tidak memengaruhi program lama atau program berikutnya.
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
          <p className="mt-1 text-xs text-slate-500">Boleh 0% sampai {institutionMaximum.toFixed(2)}%.</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Porsi Amil Platform</p>
          <p className="mt-3 text-2xl font-black text-slate-800">{platform.toFixed(2)}%</p>
          <p className="mt-1 text-xs text-slate-500">Snapshot platform untuk program ini.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Total Porsi Amil</p>
          <p className={`mt-3 text-2xl font-black ${total > maximum ? "text-red-600" : "text-slate-800"}`}>{total.toFixed(2)}%</p>
          <p className="mt-1 text-xs text-slate-500">Batas maksimum {maximum.toFixed(2)}%.</p>
        </div>
      </div>

      {errors.institutionPercentage?.message && <p className="text-xs font-medium text-red-600">{String(errors.institutionPercentage.message)}</p>}
      {total > maximum && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> Total porsi amil {total.toFixed(2)}% melebihi batas maksimum {maximum.toFixed(2)}%.
        </div>
      )}

      {isLocked && (
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700">
          <strong>Snapshot amil terkunci.</strong> Program sudah pernah dipublikasikan sehingga kategori dan persentasenya tidak dapat diubah.
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-blue-900">Ingin mengubah porsi amil platform?</p>
          <p className="mt-1 text-sm text-blue-700">Persetujuan akan mengubah default untuk program berikutnya, bukan snapshot program yang sudah dibuat.</p>
        </div>
        <Link
          href={`/dashboard/lembaga/finance/amil-platform-request?category=${category}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Ajukan Perubahan <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Building2 className="h-4 w-4" /> Porsi ini hanya berlaku pada program ini dan disimpan pada setiap transaksi donasi.
      </div>
    </section>
  );
}
