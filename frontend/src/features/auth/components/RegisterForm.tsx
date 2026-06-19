import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerSchema, type RegisterInput } from "@/features/auth/validations/auth.schema";
import { FormWrapper, FormField, Button } from "@/components/ui";
import { Link } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";

export function RegisterForm() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    setIsPending(true);
    try {
      await api.post("/auth/register", data);
      await refresh();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Pendaftaran gagal");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormWrapper
        schema={registerSchema}
        onSubmit={onSubmit}
        defaultValues={{ name: "", email: "", password: "", confirmPassword: "" }}
        error={error}
      >
        <FormField name="name" label="Nama Lengkap" type="input" placeholder="John Doe" disabled={isPending} />
        <FormField
          name="email"
          label="Email"
          type="input"
          inputType="email"
          placeholder="john@example.com"
          autoComplete="email"
          disabled={isPending}
        />
        <FormField
          name="password"
          label="Password"
          type="input"
          inputType="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isPending}
        />
        <FormField
          name="confirmPassword"
          label="Konfirmasi Password"
          type="input"
          inputType="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isPending}
        />
        <Button type="submit" isLoading={isPending} className="w-full text-sm font-semibold">
          Daftar
        </Button>
      </FormWrapper>

      <p className="text-center text-sm text-secondary">
        Sudah punya akun?{" "}
        <Link
          to="/login"
          className="text-brand-primary hover:text-brand-secondary hover:underline font-semibold transition"
        >
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
