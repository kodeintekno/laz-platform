import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@/features/auth/validations/auth.schema";
import { FormWrapper, FormField, Button } from "@/components/ui";
import { Link } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";

export function LoginForm() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
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
