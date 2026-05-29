import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { UserForm } from "@/features/users/components/UserForm";
import { redirect, notFound } from "next/navigation";
import { updateUserAction } from "@/features/users/actions/users.actions";
import { usersService } from "@/features/users/services/users.service";

export const metadata = {
  title: "Ubah Data Pengguna",
};

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.USERS_UPDATE)) {
    redirect("/dashboard/users");
  }

  // Fetch the user record with relations
  const user = await usersService.getUserById(id);

  if (!user) {
    notFound();
  }

  const isSuperAdmin = session.user.roleName === "SUPER_ADMIN";
  const queryLazId = isSuperAdmin ? undefined : session.user.lazId;

  // Safety check: LAZ admins cannot edit users from other LAZs
  if (!isSuperAdmin && user.lazId !== session.user.lazId) {
    redirect("/dashboard/users");
  }

  const [roles, lazs] = await Promise.all([
    usersService.getRoles(),
    isSuperAdmin ? usersService.getAllLazs() : Promise.resolve([]),
  ]);

  const bindedAction = updateUserAction.bind(null, id);

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold leading-6 text-primary">
          Ubah Data Pengguna
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Perbarui informasi profil, peran, status, atau password pengguna di sini.
        </p>
      </div>

      <UserForm
        initialData={user as any}
        roles={roles}
        lazs={lazs}
        isSuperAdmin={isSuperAdmin}
        currentUserId={session.user.id}
        action={bindedAction}
      />
    </div>
  );
}
