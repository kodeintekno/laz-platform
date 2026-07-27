import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { volunteerLoginSchema, type VolunteerLoginInput } from "../validations/volunteers.schema";
import { FormWrapper, FormField, Button } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useVolunteerAuth } from "@/auth/VolunteerAuthProvider";

export function VolunteerLoginForm() {
  const navigate = useNavigate();
  const { refresh } = useVolunteerAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: VolunteerLoginInput) => {
    setError(null);
    setIsPending(true);
    try {
      await api.post("/volunteers/login", data);
      await refresh();
      navigate("/volunteer/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Login gagal");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormWrapper
        schema={volunteerLoginSchema}
        onSubmit={onSubmit}
        defaultValues={{ email: "", password: "" }}
        error={error}
      >
        <FormField name="email" label="Email" type="input" inputType="email" placeholder="nama@email.com" autoComplete="email" />
        <FormField name="password" label="Password" type="input" inputType="password" placeholder="••••••••" autoComplete="current-password" />
        <Button type="submit" isLoading={isPending} className="w-full text-sm font-semibold">
          Masuk sebagai Relawan
        </Button>
      </FormWrapper>

      <p className="text-center text-sm text-secondary">
        Belum punya akun relawan?{" "}
        <Link to="/volunteer/register" className="text-brand-primary hover:underline font-semibold">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
