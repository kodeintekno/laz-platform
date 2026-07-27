import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@/features/auth/validations/auth.schema";
import { FormWrapper, FormField, Button } from "@/components/ui";
import { Link } from "react-router-dom";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { useVolunteerAuth } from "@/auth/VolunteerAuthProvider";

export function LoginForm() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const { refresh: refreshVolunteer } = useVolunteerAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setIsPending(true);
    try {
      await api.post("/auth/login", data);
      await refresh();
      navigate("/dashboard");
    } catch (err: any) {
      // Relawan adalah principal terpisah (bukan baris User) — kredensial
      // salah di sisi staff (401) dicoba ulang sebagai akun relawan sebelum
      // menampilkan error, supaya satu form /login melayani ketiganya
      // (Super Admin, Admin Lembaga, Relawan).
      if (err instanceof ApiError && err.status === 401) {
        try {
          await api.post("/volunteers/login", data);
          await refreshVolunteer();
          navigate("/volunteer/dashboard");
          return;
        } catch {
          // bukan akun relawan juga — lanjut tampilkan error staff di bawah
        }
      }
      setError(err?.message ?? "Login gagal");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormWrapper
        schema={loginSchema}
        onSubmit={onSubmit}
        defaultValues={{ email: "", password: "" }}
        error={error}
      >
        <FormField
          name="email"
          label="Email"
          type="input"
          inputType="email"
          placeholder="admin@laz.id"
          autoComplete="email"
        />
        <FormField
          name="password"
          label="Password"
          type="input"
          inputType="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <Button type="submit" isLoading={isPending} className="w-full text-sm font-semibold">
          Masuk
        </Button>
      </FormWrapper>

      <p className="text-center text-sm text-secondary">
        Belum punya akun?{" "}
        <Link
          to="/register"
          className="text-brand-primary hover:text-brand-secondary hover:underline font-semibold transition"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
