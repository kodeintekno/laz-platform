"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { programSchema } from "@/features/programs/validations/programs.schema";
import type { ProgramInput } from "@/features/programs/validations/programs.schema";
import { createProgramAction } from "@/features/programs/actions/programs.actions";
import { ProgramCategory, ProgramStatus } from "@prisma/client";
import Link from "next/link";
import { Input, Textarea, Select, Button, Alert } from "@/components/ui";

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
        <Alert intent="error">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-foreground mb-1">Judul Program</label>
          <Input
            {...register("title")}
            type="text"
            error={!!errors.title}
            disabled={isPending}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-foreground mb-1">Deskripsi Lengkap</label>
          <Textarea
            {...register("description")}
            rows={5}
            error={!!errors.description}
            disabled={isPending}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">Target Dana (Rp)</label>
          <Input
            {...register("targetAmount")}
            type="number"
            error={!!errors.targetAmount}
            disabled={isPending}
          />
          {errors.targetAmount && <p className="mt-1 text-xs text-red-500">{errors.targetAmount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">Kategori</label>
          <Select
            {...register("category")}
            error={!!errors.category}
            disabled={isPending}
          >
            {Object.values(ProgramCategory).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">Status Publikasi</label>
          <Select
            {...register("status")}
            error={!!errors.status}
            disabled={isPending}
          >
            <option value={ProgramStatus.DRAFT}>Draft (Sembunyikan)</option>
            <option value={ProgramStatus.PUBLISHED}>Published (Tampilkan Publik)</option>
          </Select>
          {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">URL Gambar Header</label>
          <Input
            {...register("image")}
            type="text"
            placeholder="https://example.com/image.jpg"
            error={!!errors.image}
            disabled={isPending}
          />
          {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-4 pt-4 border-t border-gray-200">
        <Link href="/dashboard/programs" className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 transition-colors">
          Batal
        </Link>
        <Button
          type="submit"
          disabled={isPending}
          isLoading={isPending}
        >
          Simpan Program
        </Button>
      </div>
    </form>
  );
}

