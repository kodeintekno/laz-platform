"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { programSchema, type ProgramInput } from "@/features/programs/validations/programs.schema";
import { createProgramAction } from "@/features/programs/actions/programs.actions";
// Removed Prisma enum import – using static values for client component
import Link from "next/link";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";

export function ProgramForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
        defaultValues={{
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

          <FormField
            name="description"
            label="Deskripsi Lengkap"
            type="textarea"
            rows={5}
            placeholder="Tulis deskripsi program lengkap di sini..."
            disabled={isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              name="targetAmount"
              label="Target Dana (Rp)"
              type="input"
              inputType="number"
              placeholder="0"
              disabled={isPending}
            />

            <FormField
              name="category"
              label="Kategori"
              type="select"
              options={categoryOptions}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              name="status"
              label="Status Publikasi"
              type="select"
              options={statusOptions}
              disabled={isPending}
            />

            <FormField
              name="image"
              label="URL Gambar Header"
              type="input"
              placeholder="https://example.com/image.jpg"
              disabled={isPending}
            />
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-x-4 border-t border-border pt-4">
          <Link href="/dashboard/programs" className="text-sm font-semibold leading-6 text-secondary hover:text-brand-primary transition">
            Batal
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            isLoading={isPending}
          >
            Simpan Program
          </Button>
        </CardFooter>
      </FormWrapper>
    </Card>
  );
}
