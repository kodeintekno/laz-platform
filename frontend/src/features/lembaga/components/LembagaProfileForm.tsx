import { useState } from "react";
import {
  lembagaProfileSchema,
  type LembagaProfileInput,
} from "../validations/lembaga.schema";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";
import { FileUpload } from "@/components/ui/FileUpload";
import { api } from "@/lib/api-client";
import { toast } from "@/stores/toast.store";
import type { Lembaga } from "@prisma/client";

export function LembagaProfileForm({ initialData }: { initialData: Lembaga }) {
  const [isPending, setIsPending] = useState(false);
  const [logo, setLogo] = useState({ url: initialData.logoUrl ?? "", publicId: initialData.logoPublicId ?? "" });
  const [officePhoto, setOfficePhoto] = useState({
    url: initialData.officePhotoUrl ?? "",
    publicId: initialData.officePhotoPublicId ?? "",
  });

  const onSubmit = async (data: LembagaProfileInput) => {
    setIsPending(true);
    try {
      await api.patch("/lembaga/me", {
        ...data,
        logoUrl: logo.url || undefined,
        logoPublicId: logo.publicId || undefined,
        officePhotoUrl: officePhoto.url || undefined,
        officePhotoPublicId: officePhoto.publicId || undefined,
      });
      toast.success("Profil lembaga berhasil diperbarui!");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal memperbarui profil lembaga");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <FormWrapper<LembagaProfileInput>
        schema={lembagaProfileSchema}
        onSubmit={onSubmit}
        defaultValues={{
          name: initialData.name,
          picName: initialData.picName,
          picPhone: initialData.picPhone ?? "",
          address: initialData.address,
          description: initialData.description ?? "",
          website: initialData.website ?? "",
          izinYayasanNumber: initialData.izinYayasanNumber ?? "",
          bankCode: (initialData as any).bankCode ?? "",
          accountNumber: (initialData as any).accountNumber ?? "",
          accountHolder: (initialData as any).accountHolder ?? "",
        }}
      >
        <CardContent className="space-y-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField name="name" label="Nama Lembaga" type="input" disabled={isPending} />
            <FormField name="picName" label="Nama Penanggung Jawab" type="input" disabled={isPending} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField name="picPhone" label="No. Telepon PIC" type="input" inputType="tel" disabled={isPending} />
            <FormField name="website" label="Website" type="input" placeholder="https://" disabled={isPending} />
          </div>
          <FormField name="address" label="Alamat Lengkap" type="textarea" rows={2} disabled={isPending} />
          <FormField name="description" label="Deskripsi Lembaga" type="textarea" rows={4} disabled={isPending} />
          <FormField name="izinYayasanNumber" label="Nomor Izin Yayasan" type="input" disabled={isPending} />

          <div className="border-t border-surface-soft pt-6 mt-6">
            <h3 className="text-lg font-medium text-surface-stronger mb-4">Pengaturan Rekening Bank (Untuk Pencairan Dana)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <FormField 
                name="bankCode" 
                label="Kode Bank (Bank Tujuan)" 
                type="select" 
                disabled={isPending} 
                options={[
                  { label: "BCA - Bank Central Asia", value: "ID_BCA" },
                  { label: "Mandiri - Bank Mandiri", value: "ID_MANDIRI" },
                  { label: "BRI - Bank Rakyat Indonesia", value: "ID_BRI" },
                  { label: "BNI - Bank Negara Indonesia", value: "ID_BNI" },
                  { label: "BSI - Bank Syariah Indonesia", value: "ID_BSI" },
                  { label: "Permata - Bank Permata", value: "ID_PERMATA" },
                  { label: "CIMB Niaga", value: "ID_CIMB" },
                  { label: "Danamon", value: "ID_DANAMON" },
                  { label: "Muamalat", value: "ID_MUAMALAT" }
                ]}
              />
              <FormField 
                name="accountNumber" 
                label="Nomor Rekening" 
                type="input" 
                disabled={isPending} 
              />
            </div>
            <FormField 
              name="accountHolder" 
              label="Nama Pemilik Rekening" 
              type="input" 
              disabled={isPending} 
            />
          </div>

          <FileUpload
            name="logoUrl"
            label="Logo Lembaga"
            folder="lembaga-logos"
            disabled={isPending}
            initialUrl={initialData.logoUrl ?? ""}
            initialPublicId={initialData.logoPublicId ?? ""}
            onUpload={setLogo}
            onRemove={() => setLogo({ url: "", publicId: "" })}
          />
          <FileUpload
            name="officePhotoUrl"
            label="Foto Kantor"
            folder="lembaga/office-photo"
            disabled={isPending}
            initialUrl={initialData.officePhotoUrl ?? ""}
            initialPublicId={initialData.officePhotoPublicId ?? ""}
            onUpload={setOfficePhoto}
            onRemove={() => setOfficePhoto({ url: "", publicId: "" })}
          />
        </CardContent>

        <CardFooter className="flex justify-end border-t border-surface-soft pt-6 mt-6">
          <Button type="submit" isLoading={isPending} disabled={isPending}>
            Simpan Perubahan
          </Button>
        </CardFooter>
      </FormWrapper>
    </Card>
  );
}
