"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { distributionSchema } from "@/features/distributions/validations/distributions.schema";
import type { DistributionInput } from "@/features/distributions/validations/distributions.schema";
import { createDistributionAction } from "@/features/distributions/actions/distributions.actions";
import { Button, Input, Textarea, Card, CardContent, CardFooter, Alert } from "@/components/ui";
import { toast } from "@/stores/toast.store";
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
        toast.error(result.error);
      } else if (result?.success) {
        toast.success("Penyaluran dana berhasil diajukan!");
        router.push("/dashboard/distributions");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-6">
          {error && (
            <Alert intent="error">
              {error}
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Judul Penyaluran</label>
              <Input
                {...register("title")}
                type="text"
                error={!!errors.title}
                placeholder="Contoh: Pembelian Material Gelombang 1"
                disabled={isPending}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Nominal (Rp)</label>
              <Input
                {...register("amount")}
                type="number"
                error={!!errors.amount}
                disabled={isPending}
              />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Deskripsi & Rincian Penggunaan</label>
              <Textarea
                {...register("description")}
                rows={5}
                error={!!errors.description}
                disabled={isPending}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">URL Bukti / Dokumentasi (Opsional)</label>
              <Input
                {...register("receiptImage")}
                type="text"
                error={!!errors.receiptImage}
                placeholder="https://example.com/kwitansi.jpg"
                disabled={isPending}
              />
              {errors.receiptImage && <p className="mt-1 text-xs text-red-500">{errors.receiptImage.message}</p>}
            </div>
          </div>

        </CardContent>

        <CardFooter className="flex items-center justify-end gap-x-4">
          <Link href={`/dashboard/programs`} className="text-sm font-semibold leading-6 text-foreground hover:text-gray-500 transition">
            Batal
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            isLoading={isPending}
            intent="primary"
          >
            Ajukan Penyaluran
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
