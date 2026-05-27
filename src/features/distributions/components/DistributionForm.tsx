"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { distributionSchema, type DistributionInput } from "@/features/distributions/validations/distributions.schema";
import { createDistributionAction } from "@/features/distributions/actions/distributions.actions";
import { Button, Card, CardContent, CardFooter, FormWrapper, FormField } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import Link from "next/link";

export function DistributionForm({ programId, availableBalance }: { programId: string, availableBalance: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
    <Card>
      <FormWrapper
        schema={distributionSchema}
        onSubmit={onSubmit}
        defaultValues={{
          programId,
          amount: 0,
          title: "",
          description: "",
          receiptImage: "",
        }}
        error={error}
      >
        <CardContent className="space-y-6">
          <FormField
            name="title"
            label="Judul Penyaluran"
            type="input"
            placeholder="Contoh: Pembelian Material Gelombang 1"
            disabled={isPending}
          />

          <FormField
            name="amount"
            label="Nominal (Rp)"
            type="input"
            inputType="number"
            disabled={isPending}
          />

          <FormField
            name="description"
            label="Deskripsi & Rincian Penggunaan"
            type="textarea"
            rows={5}
            placeholder="Rincian penggunaan dana..."
            disabled={isPending}
          />

          <FormField
            name="receiptImage"
            label="URL Bukti / Dokumentasi (Opsional)"
            type="input"
            placeholder="https://example.com/kwitansi.jpg"
            disabled={isPending}
          />
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-x-4 border-t border-border pt-4">
          <Link href={`/dashboard/programs`} className="text-sm font-semibold leading-6 text-text-secondary hover:text-brand-primary transition">
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
      </FormWrapper>
    </Card>
  );
}
