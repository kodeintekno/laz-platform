"use client";

import { useTransition } from "react";
import { z } from "zod";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { logger } from "@/lib/logger";

const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  roleId: z.string().min(1, "Silakan pilih role"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "Anda harus menyetujui kebijakan privasi",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak sesuai",
  path: ["confirmPassword"],
});

type CreateUserInput = z.infer<typeof createUserSchema>;

interface UserCreateFormProps {
  roles: { id: string; name: string }[];
}

export function UserCreateForm({ roles }: UserCreateFormProps) {
  const [isPending, startTransition] = useTransition();

  const onSubmit = (data: CreateUserInput) => {
    startTransition(async () => {
      // Mocking user creation network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      logger.info({ email: data.email, name: data.name }, "Creating user (Simulated)");
      toast.success(`Pengguna "${data.name}" berhasil dibuat (Simulasi)!`);
    });
  };


  const roleOptions = roles.map((role) => ({
    label: role.name,
    value: role.id,
  }));

  return (
    <Card className="max-w-xl mx-auto">
      <FormWrapper
        schema={createUserSchema}
        onSubmit={onSubmit}
        defaultValues={{
          name: "",
          email: "",
          roleId: "",
          password: "",
          confirmPassword: "",
          status: "ACTIVE",
          agreeTerms: false,
        }}
      >
        <CardContent className="space-y-4">
          <FormField
            name="name"
            label="Nama Lengkap"
            type="input"
            placeholder="Masukkan nama lengkap"
            disabled={isPending}
          />

          <FormField
            name="email"
            label="Alamat Email"
            type="input"
            inputType="email"
            placeholder="nama@domain.com"
            disabled={isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              name="roleId"
              label="Role Pengguna"
              type="select"
              options={roleOptions}
              disabled={isPending}
            >
              <option value="">Pilih Role...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </FormField>

            <FormField
              name="status"
              label="Status Akun"
              type="select"
              disabled={isPending}
            >
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              name="password"
              label="Password"
              type="input"
              inputType="password"
              placeholder="••••••••"
              disabled={isPending}
            />

            <FormField
              name="confirmPassword"
              label="Konfirmasi Password"
              type="input"
              inputType="password"
              placeholder="••••••••"
              disabled={isPending}
            />
          </div>

          <FormField
            name="agreeTerms"
            type="checkbox"
            label="Menyetujui Ketentuan Pengguna"
            description="Saya menyetujui kebijakan privasi dan pembuatan akun admin baru ini."
            disabled={isPending}
          />
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" intent="outline" disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" isLoading={isPending}>
            Buat Pengguna
          </Button>
        </CardFooter>
      </FormWrapper>
    </Card>
  );
}
