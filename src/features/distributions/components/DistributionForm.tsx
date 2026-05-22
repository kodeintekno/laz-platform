"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { distributionSchema } from "@/features/distributions/validations/distributions.schema";
import type { DistributionInput } from "@/features/distributions/validations/distributions.schema";
import { createDistributionAction } from "@/features/distributions/actions/distributions.actions";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";

export function DistributionForm({ programId, programSlug, availableBalance }: { programId: string, programSlug: string, availableBalance: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DistributionInput>({
    resolver: zodResolver(distributionSchema) as any,
    defaultValues: {
      programId,
      amount: 0,
      title: "",
      description: "",
      receiptImage: "",
    },
  });

  const onSubmit = (data: DistributionInput) => {
    setError(null);
    if (data.amount > availableBalance) {
      setError("Nominal tidak boleh melebihi saldo tersedia");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const result = await createDistributionAction(formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push("/dashboard/distributions");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Penyaluran</label>
          <input
            {...register("title")}
            type="text"
            placeholder="Contoh: Pembelian Material Gelombang 1"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isPending}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
          <input
            {...register("amount")}
            type="number"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isPending}
          />
          {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi & Rincian Penggunaan</label>
          <textarea
            {...register("description")}
            rows={5}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isPending}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Bukti / Dokumentasi (Opsional)</label>
          <input
            {...register("receiptImage")}
            type="text"
            placeholder="https://example.com/kwitansi.jpg"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isPending}
          />
          {errors.receiptImage && <p className="mt-1 text-xs text-red-500">{errors.receiptImage.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-4 pt-4 border-t border-gray-200">
        <Link href={`/dashboard/programs`} className="text-sm font-semibold leading-6 text-gray-900">
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 inline-flex items-center gap-2"
        >
          {isPending && <LoadingSpinner size="sm" />}
          Ajukan Penyaluran
        </button>
      </div>
    </form>
  );
}
