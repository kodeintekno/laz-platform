import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { usersService } from "@/features/users/services/users.service";
import { UserForm } from "@/features/users/components/UserForm";
import { redirect } from "next/navigation";

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
    usersService.getRoles(queryLazId),
    isSuperAdmin ? usersService.getAllLazs() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold leading-6 text-primary">Tambah Pengguna Baru</h1>
        <p className="mt-2 text-sm text-secondary">
          Buat akun baru untuk pengelola LAZ, relawan, donatur, atau administrator.
        </p>
      </div>

      <UserForm
        roles={roles}
        lazs={lazs}
        isSuperAdmin={isSuperAdmin}
        currentUserId={session.user.id}
      />
    </div>
  );
}
