"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { distributionSchema, type DistributionInput } from "@/features/distributions/validations/distributions.schema";
import { createDistributionAction } from "@/features/distributions/actions/distributions.actions";
import { Button, Card, CardContent, CardFooter, FormWrapper, FormField } from "@/components/ui";
import { FileUpload } from "@/components/ui/FileUpload";
import { toast } from "@/stores/toast.store";
import { logger } from "@/lib/logger";

export function DistributionForm({
  programId,
  mustahiqBalance,
  amilBalance,
}: {
  programId: string;
  mustahiqBalance: number;
  amilBalance: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [uploadedReceiptImageUrl, setUploadedReceiptImageUrl] = useState<string>('');
  const [uploadedReceiptImagePublicId, setUploadedReceiptImagePublicId] = useState<string>('');
  const uploadAbortRef = useRef<AbortController | null>(null);

  const onSubmit = (data: DistributionInput) => {
    setError(null);
    const selectedBalance = data.fundSource === "AMIL" ? amilBalance : mustahiqBalance;
    if (data.amount > selectedBalance) {
      setError(
        data.fundSource === "AMIL"
          ? "Nominal tidak boleh melebihi saldo amil lembaga"
          : "Nominal tidak boleh melebihi saldo utama/mustahiq program",
      );
      return;
    }

    startTransition(async () => {
      const formData = new FormData();

      const receiptImage = uploadedReceiptImageUrl || data.receiptImageUrl?.trim();
      const finalData = { ...data, receiptImage };

      Object.entries(finalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const result = await createDistributionAction(formData);

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        toast.success("Penyaluran dana berhasil dicatat!");
        router.push("/dashboard/distributions");
        router.refresh();
      }
    });
  };

  const handleCancel = async () => {
    uploadAbortRef.current?.abort();
    if (uploadedReceiptImagePublicId) {
      try {
        const { deleteFile } = await import("@/lib/upload/uploadService");
        await deleteFile(uploadedReceiptImagePublicId);
      } catch (e) {
        logger.error({ err: e }, "Failed to delete uploaded receipt image");
      }
      setUploadedReceiptImageUrl('');
      setUploadedReceiptImagePublicId('');
    }
    router.push("/dashboard/programs");
  };

  return (
    <Card>
      <FormWrapper
        schema={distributionSchema}
        onSubmit={onSubmit}
        defaultValues={{
          programId,
          fundSource: "MUSTAHIQ",
          amount: 0,
          title: "",
          description: "",
          receiptImageUrl: "",
        }}
        error={error}
      >
        <CardContent className="space-y-6">
          <FormField
            name="fundSource"
            label="Sumber Dana Penyaluran"
            type="select"
            disabled={isPending}
            options={[
              { label: `Saldo Utama / Mustahiq — ${formatRupiah(mustahiqBalance)}`, value: "MUSTAHIQ" },
              { label: `Saldo Amil Lembaga — ${formatRupiah(amilBalance)}`, value: "AMIL" },
            ]}
            description="Saldo yang dipilih akan dikurangi setelah penyaluran berhasil dicatat."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              type="currency"
              disabled={isPending}
            />
          </div>

          <FormField
            name="description"
            label="Deskripsi & Rincian Penggunaan"
            type="textarea"
            rows={5}
            placeholder="Rincian penggunaan dana..."
            disabled={isPending}
          />

          <FileUpload
            description="Upload bukti penyaluran/kwitansi (Opsional, PNG/JPEG, max 2 MB)"
            name="receiptImageUrl"
            label="Upload Bukti (Opsional)"
            disabled={isPending}
            abortRef={uploadAbortRef}
            initialUrl={""}
            initialPublicId={""}
            folder="distribution-receipts"
            onUpload={(payload: { url: string; publicId: string }) => {
              setUploadedReceiptImageUrl(payload.url);
              setUploadedReceiptImagePublicId(payload.publicId);
            }}
            onRemove={() => {
              setUploadedReceiptImageUrl("");
              setUploadedReceiptImagePublicId("");
            }}
          />
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-x-4 border-t border-border pt-4">
          <Button
            type="button"
            intent="secondary"
            onClick={handleCancel}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            isLoading={isPending}
            intent="primary"
          >
            Catat Penyaluran
          </Button>
        </CardFooter>
      </FormWrapper>
    </Card>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}
