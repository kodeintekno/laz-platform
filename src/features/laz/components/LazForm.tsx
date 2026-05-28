"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { lazSchema, type LazInput } from "../validations/laz.schema";
import { createLazAction } from "../actions/laz.actions";
import { type Laz } from "@prisma/client";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";
import { FileUpload } from "@/components/ui/FileUpload";

export function LazForm({ initialData, action }: { initialData?: Laz; action?: (prevState: any, formData: FormData) => Promise<any> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Local state for logo upload
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string>('');
  const [uploadedLogoPublicId, setUploadedLogoPublicId] = useState<string>('');
  // Ref to abort ongoing upload
  const uploadAbortRef = useRef<AbortController | null>(null);

  const onSubmit = (data: LazInput, _form: any) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      // Prefer uploaded logo URL if available
      const logoUrl = uploadedLogoUrl || data.logoUrl?.trim();
      const logoPublicId = uploadedLogoPublicId || data.logoPublicId;
      const finalData = { ...data, logoUrl, logoPublicId };
      Object.entries(finalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });

      let result;
      if (action) {
        result = await action(null, formData);
      } else {
        result = await createLazAction(formData);
      }

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push("/dashboard/laz");
        router.refresh();
      }
    });
  };

  const STATUS_OPTIONS = [
    { label: "Aktif", value: "ACTIVE" },
    { label: "Tidak Aktif", value: "INACTIVE" },
  ];

  return (
    <Card>
      <FormWrapper<LazInput>
        schema={lazSchema}
        onSubmit={onSubmit}
        defaultValues={initialData ? {
          name: initialData.name,
          slug: initialData.slug,
          logoUrl: initialData.logoUrl ?? "",
          logoPublicId: initialData.logoPublicId ?? "",
          status: initialData.status as "ACTIVE" | "INACTIVE",
        } : {
          name: "",
          slug: "",
          logoUrl: "",
          logoPublicId: "",
          status: "ACTIVE",
        }}
        error={error}
      >
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <FormField
            name="name"
            label="Nama Lembaga Amil Zakat (LAZ)"
            type="input"
            placeholder="Contoh: LAZ Peduli Ummat"
            disabled={isPending}
            description="Nama lengkap lembaga zakat yang akan didaftarkan."
          />

          <FormField
            name="slug"
            label="Slug Domain / Routing"
            type="input"
            placeholder="contoh-laz-peduli"
            disabled={isPending}
            description="Slug unik digunakan untuk rute URL publik (hanya huruf kecil, angka, dan tanda hubung)."
          />

          <FileUpload
            description="Upload logo lembaga (PNG/JPEG, max 2 MB)"
            name="logoUrl"
            label="Upload Logo"
            disabled={isPending}
            abortRef={uploadAbortRef}
            initialUrl={initialData?.logoUrl ?? ""}
            initialPublicId={initialData?.logoPublicId ?? ""}
            folder="laz-logos"
            onUpload={(payload: { url: string; publicId: string }) => {
              setUploadedLogoUrl(payload.url);
              setUploadedLogoPublicId(payload.publicId);
              setError(null);
            }}
            onRemove={() => {
              setUploadedLogoUrl("");
              setUploadedLogoPublicId("");
            }}
          />

          <FormField
            name="status"
            label="Status Awal"
            type="select"
            options={STATUS_OPTIONS}
            disabled={isPending}
            description="Menentukan apakah tenant LAZ ini langsung aktif dan dapat diakses."
          />
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t border-surface-soft pt-6 mt-6">
          <Button
            type="button"
            intent="secondary"
            onClick={async () => {
              // Abort any ongoing upload
              uploadAbortRef.current?.abort();
              // Delete already uploaded image if present
              if (uploadedLogoPublicId) {
                try {
                  const { deleteFile } = await import("@/lib/upload/uploadService");
                  await deleteFile(uploadedLogoPublicId);
                } catch (e) {
                  logger.error({ err: e }, "Failed to delete uploaded logo");
                }
                setUploadedLogoUrl('');
                setUploadedLogoPublicId('');
              }
              router.back();
            }}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Menyimpan..." : (initialData ? "Simpan Perubahan" : "Daftarkan LAZ")}
          </Button>
        </CardFooter>
      </FormWrapper>
    </Card>
  );
}
