"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginInput } from "@/features/auth/validations/auth.schema";
import { loginAction } from "@/features/auth/actions/auth.actions";
import { FormWrapper, FormField, Button } from "@/components/ui";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (data: LoginInput) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result = await loginAction(formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push("/dashboard");
        router.refresh(); // Ensure layout respects new session
      }
    });
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

        <Button
          type="submit"
          isLoading={isPending}
          className="w-full text-sm font-semibold"
        >
          Masuk
        </Button>
      </FormWrapper>

      <p className="text-center text-sm text-gray-500">
        Belum punya akun?{" "}
        <Link href="/register" className="text-indigo-600 hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
