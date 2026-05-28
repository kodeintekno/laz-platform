import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { lazService } from "@/features/laz/services/laz.service";
import { LazTable } from "@/features/laz/components/LazTable";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";

export const metadata = {
  title: "LAZ Management",
};

export default async function LazsPage() {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.LAZ_MANAGE)) {
    redirect("/dashboard");
  }

  const lazs = await lazService.getLazs();

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-primary">LAZ Management</h1>
          <p className="mt-2 text-sm text-secondary">
            Kelola lembaga-lembaga amil zakat (LAZ) yang terdaftar di platform multi-tenant.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link href="/dashboard/laz/new">
            <Button size="sm">Tambah LAZ</Button>
          </Link>
        </div>
      </div>

      <LazTable lazs={lazs} />
    </div>
  );
}
