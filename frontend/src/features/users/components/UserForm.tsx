"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";
import { createUserSchema, updateUserSchema } from "../validations/users.schema";
import { createUserAction, updateUserAction } from "../actions/users.actions";
import { type User } from "@prisma/client";
import { FormWrapper, FormField, Button, Card, CardContent, CardFooter } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { isPlatformRoleName } from "@shared/lib/roles";

interface UserFormProps {
  initialData?: User;
  roles: { id: string; name: string }[];
  lembagas?: { id: string; name: string }[];
  isSuperAdmin?: boolean;
  currentUserId: string;
}

function LembagaSelector({ isSuperAdmin, isPending, isSelf, lembagaOptions, roles }: any) {
  const { control } = useFormContext();
  const roleId = useWatch({ control, name: "roleId" });
  
  const selectedRole = roles.find((r: any) => r.id === roleId);
  const isPlatformRole = isPlatformRoleName(selectedRole?.name);

  if (!isSuperAdmin || isPlatformRole) return null;

  return (
    <div className="md:col-span-2">
      <FormField
        name="lembagaId"
        label="Lembaga"
        type="select"
        options={lembagaOptions}
        disabled={isPending || isSelf}
        description={isSelf ? "User platform tidak terikat pada lembaga manapun." : "Pilih lembaga tempat pengguna ini bernaung."}
      />
    </div>
  );
}

function ApprovalLimitField({ isSuperAdmin, isPending, roles }: Pick<UserFormProps, "isSuperAdmin" | "roles"> & { isPending: boolean }) {
  const { control } = useFormContext();
  const roleId = useWatch({ control, name: "roleId" });
  if (!isSuperAdmin || roles.find((role) => role.id === roleId)?.name !== "FINANCE_PLATFORM") return null;
  return <div className="md:col-span-2">
    <FormField name="withdrawalApprovalLimit" label="Batas maksimal approval pencairan (Rp)"
      type="currency" disabled={isPending} placeholder="Contoh: 50.000.000"
      description="Berlaku per pengajuan. Nominal sampai dengan batas ini dapat disetujui. Isi 0 untuk menonaktifkan approval akun ini." />
  </div>;
}

export function UserForm({
  initialData,
  roles,
  lembagas = [],
  isSuperAdmin = false,
  currentUserId,
}: UserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isSelf = initialData?.id === currentUserId;

  const onSubmit = (data: any, _form: any) => {
    startTransition(async () => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value.toString());
        }
      });

      let result;
      if (initialData) {
        result = await updateUserAction(initialData.id, formData);
      } else {
        result = await createUserAction(formData);
      }

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(initialData ? "Data pengguna berhasil diperbarui!" : "Pengguna baru berhasil ditambahkan!");
        router.push("/dashboard/users");
        router.refresh();
      }
    });
  };

  const roleOptions = [
    { label: "Pilih Role / Peran...", value: "" },
    ...roles.map((role) => ({
      label: role.name,
      value: role.id,
    })),
  ];

  const lembagaOptions = [
    { label: "Pilih Lembaga...", value: "" },
    ...lembagas.map((lembaga) => ({
      label: lembaga.name,
      value: lembaga.id,
    })),
  ];

  const STATUS_OPTIONS = [
    { label: "Aktif", value: "ACTIVE" },
    { label: "Tidak Aktif", value: "INACTIVE" },
    { label: "Ditangguhkan", value: "SUSPENDED" },
  ];

  return (
    <Card>
      <FormWrapper<any>
        schema={initialData ? updateUserSchema : createUserSchema}
        onSubmit={onSubmit}
        shouldUnregister
        defaultValues={
          initialData
            ? {
                name: initialData.name || "",
                email: initialData.email,
                roleId: initialData.roleId || "",
                lembagaId: initialData.lembagaId,
                status: initialData.status,
                withdrawalApprovalLimit: Number(initialData.withdrawalApprovalLimit ?? 0),
                password: "",
                confirmPassword: "",
              }
            : {
                name: "",
                email: "",
                roleId: "",
                lembagaId: isSuperAdmin ? "" : undefined,
                status: "ACTIVE",
                withdrawalApprovalLimit: 0,
                password: "",
                confirmPassword: "",
              }
        }
      >
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <FormField
              name="name"
              label="Nama Lengkap"
              type="input"
              placeholder="Contoh: Ahmad Fauzi"
              disabled={isPending}
              description="Nama lengkap pengguna yang akan didaftarkan."
            />

            <FormField
              name="email"
              label="Alamat Email"
              type="input"
              inputType="email"
              placeholder="ahmad@domain.com"
              disabled={isPending}
              description="Alamat email aktif untuk pengiriman notifikasi dan login."
            />

            <FormField
              name="roleId"
              label="Peran / Role Pengguna"
              type="select"
              options={roleOptions}
              disabled={isPending || isSelf}
              description={isSelf ? "Anda tidak dapat mengubah peran akun Anda sendiri." : "Hak akses yang diberikan kepada pengguna ini."}
            />

            <FormField
              name="status"
              label="Status Akun"
              type="select"
              options={STATUS_OPTIONS}
              disabled={isPending || isSelf}
              description={isSelf ? "Anda tidak dapat mengubah status akun Anda sendiri." : "Menentukan apakah akun aktif atau nonaktif."}
            />

            <ApprovalLimitField isSuperAdmin={isSuperAdmin} isPending={isPending} roles={roles} />

            <LembagaSelector
              isSuperAdmin={isSuperAdmin}
              isPending={isPending}
              isSelf={isSelf}
              lembagaOptions={lembagaOptions}
              roles={roles}
            />
          </div>

          <hr className="border-border/40 my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <FormField
              name="password"
              label={initialData ? "Password Baru (Opsional)" : "Password"}
              type="input"
              inputType="password"
              placeholder="••••••••"
              disabled={isPending}
              description={initialData ? "Biarkan kosong jika tidak ingin mengubah password." : "Minimal 6 karakter."}
            />

            <FormField
              name="confirmPassword"
              label={initialData ? "Konfirmasi Password Baru" : "Konfirmasi Password"}
              type="input"
              inputType="password"
              placeholder="••••••••"
              disabled={isPending}
              description="Ulangi password untuk verifikasi."
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t border-surface-soft pt-6 mt-6">
          <Button
            type="button"
            intent="secondary"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type="submit" isLoading={isPending} disabled={isPending}>
            {initialData ? "Simpan Perubahan" : "Tambah Pengguna"}
          </Button>
        </CardFooter>
      </FormWrapper>
    </Card>
  );
}
