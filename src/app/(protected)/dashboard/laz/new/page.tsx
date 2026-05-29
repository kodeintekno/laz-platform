import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { LazForm } from "@/features/laz/components/LazForm";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Tambah LAZ",
};

export default async function NewLazPage() {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.LAZ_MANAGE)) {
    redirect("/dashboard/laz");
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Daftarkan LAZ Baru"
        description="Tambahkan organisasi Lembaga Amil Zakat baru ke dalam platform."
      />

      <LazForm />
    </div>
  );
}
