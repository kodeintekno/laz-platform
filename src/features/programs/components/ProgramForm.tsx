"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { programSchema } from "@/features/programs/validations/programs.schema";
import type { ProgramInput } from "@/features/programs/validations/programs.schema";
import { createProgramAction } from "@/features/programs/actions/programs.actions";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProgramCategory, ProgramStatus } from "@prisma/client";
import Link from "next/link";

export function ProgramForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProgramInput>({
    resolver: zodResolver(programSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      targetAmount: 0,
      category: ProgramCategory.INFAK,
      status: ProgramStatus.DRAFT,
      image: "",
    },
  });

  const onSubmit = (data: ProgramInput) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const result = await createProgramAction(formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push("/dashboard/programs");
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Program</label>
          <input
            {...register("title")}
            type="text"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isPending}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Lengkap</label>
          <textarea
            {...register("description")}
            rows={5}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isPending}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Dana (Rp)</label>
          <input
            {...register("targetAmount")}
            type="number"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isPending}
          />
          {errors.targetAmount && <p className="mt-1 text-xs text-red-500">{errors.targetAmount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select
            {...register("category")}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isPending}
          >
            {Object.values(ProgramCategory).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status Publikasi</label>
          <select
            {...register("status")}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isPending}
          >
            <option value={ProgramStatus.DRAFT}>Draft (Sembunyikan)</option>
            <option value={ProgramStatus.PUBLISHED}>Published (Tampilkan Publik)</option>
          </select>
          {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar Header</label>
          <input
            {...register("image")}
            type="text"
            placeholder="https://example.com/image.jpg"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={isPending}
          />
          {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-4 pt-4 border-t border-gray-200">
        <Link href="/dashboard/programs" className="text-sm font-semibold leading-6 text-gray-900">
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 inline-flex items-center gap-2"
        >
          {isPending && <LoadingSpinner size="sm" />}
          Simpan Program
        </button>
      </div>
    </form>
  );
}
