import { useState, useTransition } from "react";
import { useNavigate, Link } from "react-router-dom";
import { volunteerRegistrationSchema, type VolunteerRegistrationInput } from "../validations/volunteers.schema";
import { FormWrapper, FormField, Button } from "@/components/ui";
import { FileUpload } from "@/components/ui/FileUpload";
import { api } from "@/lib/api-client";
import { useVolunteerAuth } from "@/auth/VolunteerAuthProvider";

export function VolunteerRegisterForm() {
  const navigate = useNavigate();
  const { refresh } = useVolunteerAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState({ url: "", publicId: "" });
  const [ktp, setKtp] = useState({ url: "", publicId: "" });
  const [cv, setCv] = useState({ url: "", publicId: "" });

  const onSubmit = (data: VolunteerRegistrationInput) => {
    setError(null);
    startTransition(async () => {
      try {
        await api.post("/volunteers/register", {
          ...data,
          photoUrl: photo.url || undefined,
          photoPublicId: photo.publicId || undefined,
          ktpUrl: ktp.url || undefined,
          ktpPublicId: ktp.publicId || undefined,
          cvUrl: cv.url || undefined,
          cvPublicId: cv.publicId || undefined,
        });
        await refresh();
        navigate("/volunteer/dashboard");
      } catch (err: any) {
        setError(err?.message ?? "Pendaftaran gagal");
      }
    });
  };

  return (
    <div className="space-y-6">
      <FormWrapper
        schema={volunteerRegistrationSchema}
        onSubmit={onSubmit}
        defaultValues={{
          name: "",
          email: "",
          phone: "",
          address: "",
          password: "",
          confirmPassword: "",
        }}
        error={error}
      >
        <FormField name="name" label="Nama Lengkap" type="input" placeholder="Nama lengkap Anda" disabled={isPending} />
        <FormField name="email" label="Email" type="input" inputType="email" placeholder="nama@email.com" disabled={isPending} />
        <FormField name="phone" label="Nomor Telepon" type="input" inputType="tel" placeholder="081234567890" disabled={isPending} />
        <FormField name="address" label="Alamat (Opsional)" type="textarea" rows={2} disabled={isPending} />
        <FormField name="password" label="Password" type="input" inputType="password" placeholder="••••••••" disabled={isPending} />
        <FormField name="confirmPassword" label="Konfirmasi Password" type="input" inputType="password" placeholder="••••••••" disabled={isPending} />

        <FileUpload
          name="photoUrl"
          label="Foto Diri (Opsional)"
          folder="volunteers/photo"
          disabled={isPending}
          onUpload={(p) => setPhoto(p)}
          onRemove={() => setPhoto({ url: "", publicId: "" })}
        />
        <FileUpload
          name="ktpUrl"
          label="Upload KTP (Opsional)"
          accept="image/png, image/jpeg, application/pdf"
          folder="volunteers/documents"
          disabled={isPending}
          onUpload={(p) => setKtp(p)}
          onRemove={() => setKtp({ url: "", publicId: "" })}
        />
        <FileUpload
          name="cvUrl"
          label="Upload CV (Opsional)"
          accept="image/png, image/jpeg, application/pdf"
          folder="volunteers/documents"
          disabled={isPending}
          onUpload={(p) => setCv(p)}
          onRemove={() => setCv({ url: "", publicId: "" })}
        />

        <Button type="submit" isLoading={isPending} className="w-full text-sm font-semibold">
          Daftar sebagai Relawan
        </Button>
      </FormWrapper>

      <p className="text-center text-sm text-secondary">
        Sudah punya akun relawan?{" "}
        <Link to="/volunteer/login" className="text-brand-primary hover:underline font-semibold">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
