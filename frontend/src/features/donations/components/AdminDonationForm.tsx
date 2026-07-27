"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminDonationSchema, type AdminDonationInput } from "@/features/donations/validations/donations.schema";
import { createAdminDonationAction } from "@/features/donations/actions/donations.actions";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";

export function AdminDonationForm({
  programs,
  users,
}: {
  programs: { id: string; title: string }[];
  users: { id: string; name: string | null; email: string | null }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (data: AdminDonationInput) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value.toString());
        }
      });

      const result = await createAdminDonationAction(formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push("/dashboard/donations");
        router.refresh();
      }
    });
  };

  const programOptions = programs.map(p => ({ label: p.title, value: p.id }));
  
  // Adding a "Guest" option to userOptions
  const userOptions = [
    { label: "-- Offline Guest (Tanpa Akun) --", value: "" },
    ...users.map(u => ({ label: `${u.name || 'No Name'} (${u.email})`, value: u.id }))
  ];

  return (
    <FormWrapper
      schema={adminDonationSchema}
      onSubmit={onSubmit}
      defaultValues={{
        programId: "",
        donorName: "",
        amount: 50000,
        message: "",
        isAnonymous: false,
        status: "PAID",
      }}
      error={error}
    >
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              name="programId"
              label="Pilih Program"
              type="select"
              options={programOptions}
              disabled={isPending}
            />
            
            <FormField
              name="amount"
              label="Nominal Donasi (Rp)"
              type="input"
              inputType="number"
              disabled={isPending}
            />

            <FormField
              name="userId"
              label="Pilih Akun Donatur (Opsional)"
              type="select"
              options={userOptions}
              disabled={isPending}
            />

            <FormField
              name="donorName"
              label="Nama Donatur Offline (Jika tanpa akun)"
              type="input"
              inputType="text"
              placeholder="Contoh: Budi Santoso"
              disabled={isPending}
            />

            <FormField
              name="status"
              label="Status Pembayaran"
              type="select"
              options={[
                { label: "LUNAS (PAID) - Saldo Program akan bertambah", value: "PAID" },
                { label: "PENDING - Menunggu Pembayaran", value: "PENDING" },
                { label: "FAILED - Dibatalkan/Gagal", value: "FAILED" },
              ]}
              disabled={isPending}
            />
          </div>

          <FormField
            name="message"
            label="Catatan / Pesan Dukungan"
            type="textarea"
            rows={3}
            placeholder="Tulis pesan atau doa..."
            disabled={isPending}
          />

          <FormField
            name="isAnonymous"
            label="Sembunyikan Nama (Hamba Allah)"
            type="checkbox"
            description="Jika dicentang, nama tidak akan ditampilkan di halaman publik."
            disabled={isPending}
          />
        </CardContent>
        <CardFooter className="flex justify-end space-x-4 border-t border-border/40 pt-6">
          <Button
            type="button"
            intent="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type="submit" intent="primary" isLoading={isPending}>
            Simpan Donasi
          </Button>
        </CardFooter>
      </Card>
    </FormWrapper>
  );
}
