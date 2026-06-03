"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { programSchema, type ProgramInput } from "@/features/programs/validations/programs.schema";
import { createProgramAction } from "@/features/programs/actions/programs.actions";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";
import { FileUpload } from "@/components/ui/FileUpload";
import { logger } from "@/lib/logger";
import { type Program } from "@prisma/client";

export function ProgramForm({
  initialData,
  action,
}: {
  initialData?: Program;
  action?: (prevState: any, formData: FormData) => Promise<any>;
}) {
  const router = useRouter();
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

  const PROGRAM_CATEGORIES = ["ZAKAT", "INFAK", "SEDEKAH", "WAKAF"] as const;
  const PROGRAM_STATUSES = [{ label: "Draft (Sembunyikan)", value: "DRAFT" }, { label: "Published (Tampilkan Publik)", value: "PUBLISHED" }] as const;

  const categoryOptions = PROGRAM_CATEGORIES.map((cat) => ({
    label: cat,
    value: cat,
  }));

  const statusOptions = PROGRAM_STATUSES.map((s) => ({
    label: s.label,
    value: s.value,
  }));

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
        } : {
          title: "",
          description: "",
          targetAmount: 0,
          category: "INFAK",
          status: "DRAFT",
          image: "",
        }}
        error={error}
      >
        <CardContent className="space-y-6">
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
              disabled={isPending}
            />

            <FormField
              name="targetAmount"
              label="Target Dana (Rp)"
              type="input"
              inputType="number"
              placeholder="0"
              disabled={isPending}
            />

            <FormField
              name="status"
              label="Status Publikasi"
              type="select"
              options={statusOptions}
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
