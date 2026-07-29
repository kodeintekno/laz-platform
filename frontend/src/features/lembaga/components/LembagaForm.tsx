import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { lembagaAdminSchema, type LembagaAdminInput } from "../validations/lembaga.schema";
import { createLembagaAction } from "../actions/lembaga.actions";
import { type Lembaga } from "@prisma/client";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";
import { FileUpload } from "@/components/ui/FileUpload";
import { toast } from "@/stores/toast.store";

export function LembagaForm({ initialData, action }: { initialData?: Lembaga; action?: (prevState: any, formData: FormData) => Promise<any> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string>('');
  const [uploadedLogoPublicId, setUploadedLogoPublicId] = useState<string>('');
  const uploadAbortRef = useRef<AbortController | null>(null);

  const onSubmit = (data: LembagaAdminInput, _form: any) => {
    startTransition(async () => {
      const formData = new FormData();
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
        result = await createLembagaAction(formData);
      }

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(initialData ? "Data lembaga berhasil diperbarui!" : "Lembaga baru berhasil didaftarkan!");
        router.push("/dashboard/lembaga");
        router.refresh();
      }
    });
  };

  const STATUS_OPTIONS = [
    { label: "Menunggu Persetujuan", value: "PENDING" },
    { label: "Disetujui", value: "APPROVED" },
    { label: "Ditolak", value: "REJECTED" },
  ];

  return (
    <Card>
      <FormWrapper<LembagaAdminInput>
        schema={lembagaAdminSchema}
        onSubmit={onSubmit}
        defaultValues={initialData ? {
          name: initialData.name,
          slug: initialData.slug,
          logoUrl: initialData.logoUrl ?? "",
          logoPublicId: initialData.logoPublicId ?? "",
          status: initialData.status,
        } : {
          name: "",
          slug: "",
          logoUrl: "",
          logoPublicId: "",
          status: "PENDING",
        }}
      >
        <CardContent className="space-y-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              name="name"
              label="Nama Lembaga"
              type="input"
              placeholder="Contoh: Yayasan Peduli Umat"
              disabled={isPending}
              description="Nama lengkap lembaga/yayasan yang akan didaftarkan."
            />

            <FormField
              name="slug"
              label="Slug Domain / Routing"
              type="input"
              placeholder="contoh-lembaga-peduli"
              disabled={isPending}
              description="Slug unik digunakan untuk rute URL publik (hanya huruf kecil, angka, dan tanda hubung)."
            />
          </div>

          <FormField
            name="status"
            label="Status"
            type="select"
            options={STATUS_OPTIONS}
            disabled={isPending}
            description="Status persetujuan lembaga sebagai tenant platform."
          />

          <FileUpload
            description="Upload logo lembaga (PNG/JPEG, max 2 MB)"
            name="logoUrl"
            label="Upload Logo"
            disabled={isPending}
            abortRef={uploadAbortRef}
            initialUrl={initialData?.logoUrl ?? ""}
            initialPublicId={initialData?.logoPublicId ?? ""}
            folder="lembaga-logos"
            onUpload={(payload: { url: string; publicId: string }) => {
              setUploadedLogoUrl(payload.url);
              setUploadedLogoPublicId(payload.publicId);
            }}
            onRemove={() => {
              setUploadedLogoUrl("");
              setUploadedLogoPublicId("");
            }}
          />
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t border-surface-soft pt-6 mt-6">
          <Button
            type="button"
            intent="secondary"
            onClick={async () => {
              uploadAbortRef.current?.abort();
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
            {isPending ? "Menyimpan..." : (initialData ? "Simpan Perubahan" : "Daftarkan Lembaga")}
          </Button>
        </CardFooter>
      </FormWrapper>
    </Card>
  );
}
