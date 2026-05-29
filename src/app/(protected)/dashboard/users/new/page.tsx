import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { usersService } from "@/features/users/services/users.service";
import { UserForm } from "@/features/users/components/UserForm";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Tambah Pengguna Baru",
};

export default async function NewUserPage() {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.USERS_CREATE)) {
    redirect("/dashboard/users");
  }

  const isSuperAdmin = session.user.roleName === "SUPER_ADMIN";
  const queryLazId = isSuperAdmin ? undefined : session.user.lazId;

  const [roles, lazs] = await Promise.all([
    usersService.getRoles(),
    isSuperAdmin ? usersService.getAllLazs() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Tambah Pengguna Baru"
        description="Buat akun baru untuk pengelola LAZ, relawan, donatur, atau administrator."
      />

      <UserForm
        roles={roles}
        lazs={lazs}
        isSuperAdmin={isSuperAdmin}
        currentUserId={session.user.id}
      />
    </div>
  );
}
