"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lazSchema, type LazInput } from "../validations/laz.schema";
import { createLazAction } from "../actions/laz.actions";
import { type Laz } from "@prisma/client";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";

export function LazForm({ initialData, action }: { initialData?: Laz; action?: (prevState: any, formData: FormData) => Promise<any> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Local state for logo upload
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  const onSubmit = (data: LazInput, _form: any) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      // Prefer uploaded logo URL if available
      const logoUrl = uploadedLogoUrl || data.logo?.trim();
      const finalData = { ...data, logo: logoUrl };
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
      <FormWrapper
        schema={lazSchema}
        onSubmit={onSubmit}
        defaultValues={initialData ? {
          name: initialData.name,
          slug: initialData.slug,
          logo: initialData.logo ?? "",
          status: initialData.status as "ACTIVE" | "INACTIVE",
        } : {
          name: "",
          slug: "",
          logo: "",
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

          <FormField
            name="logo"
            label="URL Logo (Opsional)"
            type="input"
            placeholder="https://example.com/logo.png"
            disabled={isPending}
            description="URL publik menuju berkas gambar logo lembaga."
          />
          {/* File upload for logo */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-1">Upload Logo (PNG/JPEG, max 2 MB)</label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              disabled={isPending || uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  setError('File terlalu besar. Maksimum 2 MB.');
                  return;
                }
                setUploading(true);
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  const resp = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  });
                  if (!resp.ok) throw new Error('Upload gagal');
                  const data = await resp.json();
                  setUploadedLogoUrl(data.url);
                  setError(null);
                } catch (err) {
                  console.error(err);
                  setError('Gagal mengunggah gambar.');
                } finally {
                  setUploading(false);
                }
              }}
              className="border border-input rounded-md p-2 w-full"
            />
            {uploading && <p className="text-sm text-muted-foreground mt-1">Mengunggah...</p>}
            {uploadedLogoUrl && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Pratinjau:</p>
                <img src={uploadedLogoUrl} alt="Preview" className="h-20 object-contain" />
              </div>
            )}
          </div>

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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Menyimpan..." : (initialData ? "Simpan Perubahan" : "Daftarkan LAZ")}
          </Button>
        </CardFooter>
      </FormWrapper>
    </Card>
  );
}
