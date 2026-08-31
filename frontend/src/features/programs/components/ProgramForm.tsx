"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { programSchema, type ProgramInput } from "@/features/programs/validations/programs.schema";
import { createProgramAction } from "@/features/programs/actions/programs.actions";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";
import { FileUpload } from "@/components/ui/FileUpload";
import { logger } from "@/lib/logger";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { type Program } from "@prisma/client";
import { ProgramAmilAllocation } from "@/features/amil/components/ProgramAmilAllocation";
import { useAuth } from "@/auth/AuthProvider";

export function ProgramForm({
  initialData,
  action,
}: {
  initialData?: Program;
  action?: (prevState: any, formData: FormData) => Promise<any>;
}) {
  const router = useRouter();
  const { can } = usePermission();
  const { user } = useAuth();
  const canApprove = can(PERMISSIONS.PROGRAMS_APPROVE);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [uploadedImagePublicId, setUploadedImagePublicId] = useState<string>('');
  const uploadAbortRef = useRef<AbortController | null>(null);

  const onSubmit = (data: ProgramInput) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      
      const image = uploadedImageUrl || data.image?.trim();
      const finalData = { ...data, image };
      
      Object.entries(finalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      let result;
      if (action) {
        result = await action(null, formData);
      } else {
        result = await createProgramAction(formData);
      }

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push("/dashboard/programs");
        router.refresh();
      }
    });
  };

  const handleCancel = async () => {
    uploadAbortRef.current?.abort();
    // Only delete the newly uploaded file, not the existing one if we're editing
    if (uploadedImagePublicId) {
      try {
        const { deleteFile } = await import("@/lib/upload/uploadService");
        await deleteFile(uploadedImagePublicId);
      } catch (e) {
        logger.error({ err: e }, "Failed to delete uploaded program image");
      }
      setUploadedImageUrl('');
      setUploadedImagePublicId('');
    }
    router.back();
  };

  const PROGRAM_CATEGORIES = ["ZAKAT", "INFAK_SEDEKAH", "WAKAF", "CSR", "DSKL"] as const;
  const ALL_STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft (Sembunyikan)",
    PENDING_REVIEW: "Ajukan untuk Direview",
    PUBLISHED: "Published (Tampilkan Publik)",
    REJECTED: "Ditolak",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  // LEMBAGA_ADMIN can only submit Draft or ajukan-review — publikasi harus lewat persetujuan Super Admin.
  const SELF_SERVICE_STATUSES = ["DRAFT", "PENDING_REVIEW"];
  const allowedStatuses = canApprove
    ? Object.keys(ALL_STATUS_LABELS)
    : SELF_SERVICE_STATUSES.includes(initialData?.status ?? "DRAFT")
      ? SELF_SERVICE_STATUSES
      : [...SELF_SERVICE_STATUSES, initialData!.status];

  const categoryOptions = PROGRAM_CATEGORIES.map((cat) => ({
    label: cat,
    value: cat,
  }));

  const statusOptions = allowedStatuses.map((value) => ({
    label: ALL_STATUS_LABELS[value] ?? value,
    value,
  }));

  const isStatusLocked = !canApprove && initialData && !SELF_SERVICE_STATUSES.includes(initialData.status);
  const isAmilLocked = !!initialData && (
    !!initialData.amilLockedAt || ["PUBLISHED", "COMPLETED", "CANCELLED"].includes(initialData.status)
  );

  return (
    <Card>
      <FormWrapper
        schema={programSchema}
        onSubmit={onSubmit}
        defaultValues={initialData ? {
          title: initialData.title,
          description: initialData.description,
          targetAmount: Number(initialData.targetAmount),
          category: initialData.category as any,
          status: initialData.status as any,
          image: initialData.imageUrl ?? "",
          startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
          endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
          institutionPercentage: Number(initialData.amilInstitutionPercentage),
          amilPlatformPercentage: Number(initialData.amilPlatformPercentage),
          amilMaxTotalPercentage: Number(initialData.amilMaxTotalPercentage),
        } : {
          title: "",
          description: "",
          targetAmount: 0,
          category: "INFAK_SEDEKAH",
          status: "DRAFT",
          image: "",
          startDate: "",
          endDate: "",
        }}
        error={error}
      >
        <CardContent className="space-y-6">
          {initialData?.status === "REJECTED" && initialData.rejectionReason && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <p className="font-bold text-destructive mb-1">Program ini ditolak oleh Ruang Berbagi</p>
              <p className="text-secondary">{initialData.rejectionReason}</p>
              {!canApprove && (
                <p className="text-secondary mt-1">
                  Perbaiki program lalu ubah status menjadi "Ajukan untuk Direview" untuk mengajukan ulang.
                </p>
              )}
            </div>
          )}

          <FormField
            name="title"
            label="Judul Program"
            type="input"
            placeholder="Masukkan judul program"
            disabled={isPending}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="category"
              label="Kategori"
              type="select"
              options={categoryOptions}
              disabled={isPending || isAmilLocked}
              description={isAmilLocked ? "Kategori terkunci karena program sudah pernah dipublikasikan." : undefined}
            />

            <FormField
              name="targetAmount"
              label="Target Dana (Rp)"
              type="currency"
              placeholder="0"
              disabled={isPending}
            />

            <FormField
              name="status"
              label="Status Publikasi"
              type="select"
              options={statusOptions}
              disabled={isPending || isStatusLocked}
              description={isStatusLocked ? "Hanya Ruang Berbagi yang dapat mengubah status ini." : undefined}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="startDate"
              label="Tanggal Mulai (Opsional)"
              type="input"
              inputType="date"
              disabled={isPending}
            />

            <FormField
              name="endDate"
              label="Tanggal Berakhir (Opsional)"
              type="input"
              inputType="date"
              disabled={isPending}
            />
          </div>

          <FormField
            name="description"
            label="Deskripsi Lengkap"
            type="textarea"
            rows={5}
            placeholder="Tulis deskripsi program lengkap di sini..."
            disabled={isPending}
          />

          {user?.lembagaId && <ProgramAmilAllocation initialData={initialData} />}

          <FileUpload
            description="Upload gambar header (Opsional, PNG/JPEG, max 2 MB)"
            name="image"
            label="Gambar Header"
            disabled={isPending}
            abortRef={uploadAbortRef}
            initialUrl={initialData?.imageUrl ?? ""}
            initialPublicId={""} // Assuming no publicId on Program table currently
            folder="program-headers"
            onUpload={(payload: { url: string; publicId: string }) => {
              setUploadedImageUrl(payload.url);
              setUploadedImagePublicId(payload.publicId);
            }}
            onRemove={() => {
              setUploadedImageUrl("");
              setUploadedImagePublicId("");
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
          >
            {initialData ? "Simpan Perubahan" : "Simpan Program"}
          </Button>
        </CardFooter>
      </FormWrapper>
    </Card>
  );
}
