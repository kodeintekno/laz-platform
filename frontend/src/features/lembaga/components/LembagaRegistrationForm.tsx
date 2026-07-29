import { useState, useTransition } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  lembagaRegistrationSchema,
  type LembagaRegistrationInput,
} from "../validations/lembaga.schema";
import { FormWrapper, FormField, Button } from "@/components/ui";
import { FileUpload } from "@/components/ui/FileUpload";
import { api } from "@/lib/api-client";
import { toast } from "@/stores/toast.store";

type UploadState = { url: string; publicId: string };
const EMPTY_UPLOAD: UploadState = { url: "", publicId: "" };

export function LembagaRegistrationForm() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [logo, setLogo] = useState<UploadState>(EMPTY_UPLOAD);
  const [officePhoto, setOfficePhoto] = useState<UploadState>(EMPTY_UPLOAD);
  const [aktaYayasan, setAktaYayasan] = useState<UploadState>(EMPTY_UPLOAD);
  const [skKemenkumham, setSkKemenkumham] = useState<UploadState>(EMPTY_UPLOAD);
  const [npwp, setNpwp] = useState<UploadState>(EMPTY_UPLOAD);
  const [otherDocument, setOtherDocument] = useState<UploadState>(EMPTY_UPLOAD);

  const onSubmit = (data: LembagaRegistrationInput) => {
    setError(null);
    startTransition(async () => {
      try {
        await api.post("/lembaga/register", {
          ...data,
          logoUrl: logo.url || undefined,
          logoPublicId: logo.publicId || undefined,
          officePhotoUrl: officePhoto.url || undefined,
          officePhotoPublicId: officePhoto.publicId || undefined,
          aktaYayasanUrl: aktaYayasan.url || undefined,
          aktaYayasanPublicId: aktaYayasan.publicId || undefined,
          skKemenkumhamUrl: skKemenkumham.url || undefined,
          skKemenkumhamPublicId: skKemenkumham.publicId || undefined,
          npwpUrl: npwp.url || undefined,
          npwpPublicId: npwp.publicId || undefined,
          otherDocumentUrl: otherDocument.url || undefined,
          otherDocumentPublicId: otherDocument.publicId || undefined,
        });
        setSubmitted(true);
        toast.success("Pendaftaran lembaga berhasil dikirim!");
      } catch (err: any) {
        setError(err?.message ?? "Pendaftaran gagal");
      }
    });
  };

  if (submitted) {
    return (
      <div className="text-center py-10 space-y-4">
        <h2 className="text-xl font-bold text-primary">Pendaftaran Terkirim!</h2>
        <p className="text-secondary max-w-md mx-auto">
          Pendaftaran lembaga Anda sedang menunggu persetujuan Super Admin. Anda akan dapat login
          setelah pendaftaran disetujui.
        </p>
        <Button onClick={() => navigate("/login")}>Kembali ke Halaman Masuk</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FormWrapper
        schema={lembagaRegistrationSchema}
        onSubmit={onSubmit}
        defaultValues={{
          name: "",
          picName: "",
          picPhone: "",
          address: "",
          description: "",
          website: "",
          izinYayasanNumber: "",
          adminName: "",
          adminEmail: "",
          adminPassword: "",
          confirmPassword: "",
        }}
        error={error}
      >
        <h3 className="text-lg font-bold text-primary">Data Lembaga</h3>
        <FormField
          name="name"
          label="Nama Lembaga"
          type="input"
          placeholder="Yayasan Peduli Umat"
          disabled={isPending}
          description="URL profil publik lembaga akan dibuat otomatis dari nama ini."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="picName" label="Nama Penanggung Jawab" type="input" disabled={isPending} />
          <FormField name="picPhone" label="No. Telepon PIC (Opsional)" type="input" inputType="tel" disabled={isPending} />
        </div>
        <FormField name="address" label="Alamat Lengkap" type="textarea" rows={2} disabled={isPending} />
        <FormField name="description" label="Deskripsi Lembaga (Opsional)" type="textarea" rows={3} disabled={isPending} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="website" label="Website (Opsional)" type="input" placeholder="https://" disabled={isPending} />
          <FormField name="izinYayasanNumber" label="Nomor Izin Yayasan (Opsional)" type="input" disabled={isPending} />
        </div>

        <FileUpload
          name="logoUrl"
          label="Logo Lembaga (Opsional)"
          folder="lembaga/logo"
          disabled={isPending}
          onUpload={setLogo}
          onRemove={() => setLogo(EMPTY_UPLOAD)}
        />
        <FileUpload
          name="officePhotoUrl"
          label="Foto Kantor (Opsional)"
          folder="lembaga/office-photo"
          disabled={isPending}
          onUpload={setOfficePhoto}
          onRemove={() => setOfficePhoto(EMPTY_UPLOAD)}
        />

        <hr className="border-border my-2" />
        <h3 className="text-lg font-bold text-primary">Dokumen Legalitas</h3>
        <FileUpload
          name="aktaYayasanUrl"
          label="Akta Yayasan"
          accept="image/png, image/jpeg, application/pdf"
          folder="lembaga/documents"
          disabled={isPending}
          onUpload={setAktaYayasan}
          onRemove={() => setAktaYayasan(EMPTY_UPLOAD)}
        />
        <FileUpload
          name="skKemenkumhamUrl"
          label="SK Kemenkumham / Legalitas"
          accept="image/png, image/jpeg, application/pdf"
          folder="lembaga/documents"
          disabled={isPending}
          onUpload={setSkKemenkumham}
          onRemove={() => setSkKemenkumham(EMPTY_UPLOAD)}
        />
        <FileUpload
          name="npwpUrl"
          label="NPWP (Opsional)"
          accept="image/png, image/jpeg, application/pdf"
          folder="lembaga/documents"
          disabled={isPending}
          onUpload={setNpwp}
          onRemove={() => setNpwp(EMPTY_UPLOAD)}
        />
        <FileUpload
          name="otherDocumentUrl"
          label="Dokumen Pendukung Lainnya (Opsional)"
          accept="image/png, image/jpeg, application/pdf"
          folder="lembaga/documents"
          disabled={isPending}
          onUpload={setOtherDocument}
          onRemove={() => setOtherDocument(EMPTY_UPLOAD)}
        />

        <hr className="border-border my-2" />
        <h3 className="text-lg font-bold text-primary">Akun Admin Lembaga</h3>
        <FormField name="adminName" label="Nama Lengkap" type="input" disabled={isPending} />
        <FormField name="adminEmail" label="Email" type="input" inputType="email" disabled={isPending} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="adminPassword" label="Password" type="input" inputType="password" disabled={isPending} />
          <FormField name="confirmPassword" label="Konfirmasi Password" type="input" inputType="password" disabled={isPending} />
        </div>

        <Button type="submit" isLoading={isPending} className="w-full text-sm font-semibold">
          Kirim Pendaftaran
        </Button>
      </FormWrapper>

      <p className="text-center text-sm text-secondary">
        Sudah punya akun lembaga?{" "}
        <Link to="/login" className="text-brand-primary hover:underline font-semibold">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
