import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { LazForm } from "@/features/laz/components/LazForm";
import { redirect, notFound } from "next/navigation";
import { EditLazAction } from "@/features/laz/actions/laz.actions";
import { type Laz } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";

/**
 * Edit LAZ page – uses the numeric/UUID ID (not slug) from the URL.
 */
export default async function EditLazPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.LAZ_MANAGE)) {
    redirect("/dashboard/laz");
  }

  // Fetch the LAZ record directly via Prisma
  const laz = await prisma.laz.findUnique({
    where: { id },
  });

  if (!laz) {
    // Render Next.js 404 page
    notFound();
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title={`Edit LAZ – ${laz.name}`}
        description="Perbarui data organisasi LAZ di sini."
      />

      <LazForm
        initialData={laz as Laz}
        action={EditLazAction.bind(null, id)}
      />
    </div>
  );
}
