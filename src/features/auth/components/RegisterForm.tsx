"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerSchema, type RegisterInput } from "@/features/auth/validations/auth.schema";
import { registerAction } from "@/features/auth/actions/auth.actions";
import { FormWrapper, FormField, Button } from "@/components/ui";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (data: RegisterInput) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await registerAction(formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <FormWrapper
        schema={registerSchema}
        onSubmit={onSubmit}
        defaultValues={{ name: "", email: "", password: "", confirmPassword: "" }}
        error={error}
      >
        <FormField
          name="name"
          label="Nama Lengkap"
          type="input"
          placeholder="John Doe"
          disabled={isPending}
        />

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

        <Button
          type="submit"
          isLoading={isPending}
          className="w-full text-sm font-semibold"
        >
          Daftar
        </Button>
      </FormWrapper>

      <p className="text-center text-sm text-text-secondary">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-brand-primary hover:text-brand-secondary hover:underline font-semibold transition">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
