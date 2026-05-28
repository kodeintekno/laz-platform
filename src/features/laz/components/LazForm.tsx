"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lazSchema, type LazInput } from "../validations/laz.schema";
import { createLazAction } from "../actions/laz.actions";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";

export function LazForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (data: LazInput) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const result = await createLazAction(formData);

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
        defaultValues={{
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
            {isPending ? "Menyimpan..." : "Daftarkan LAZ"}
          </Button>
        </CardFooter>
      </FormWrapper>
    </Card>
  );
}
