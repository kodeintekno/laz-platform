import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { rbacService } from "@/features/rbac/services/rbac.service";
import { RoleMatrix } from "@/features/rbac/components/RoleMatrix";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "RBAC Management",
};

export default async function RBACPage() {
  const session = await auth();

  // Guard
  if (!session?.user?.permissions.includes(PERMISSIONS.ROLES_MANAGE)) {
    redirect("/dashboard");
  }

  const { roles, permissions, activeMappings } = await rbacService.getMatrixData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role & Permissions"
        description="Kelola akses sistem. Centang kotak untuk memberikan izin kepada sebuah Role, lalu klik tombol Simpan di bawah nama Role tersebut."
      />

      <RoleMatrix 
        roles={roles} 
        permissions={permissions} 
        initialActiveMappings={activeMappings} 
      />
    </div>
  );
}
