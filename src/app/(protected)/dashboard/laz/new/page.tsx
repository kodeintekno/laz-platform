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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/laz" className="p-2 text-muted hover:text-primary bg-surface rounded-full shadow-sm ring-1 ring-border flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <PageHeader
            title="Daftarkan LAZ Baru"
            description="Tambahkan organisasi Lembaga Amil Zakat baru ke dalam platform."
          />
        </div>
      </div>

      <LazForm />
    </div>
  );
}
