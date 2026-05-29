import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { ProgramForm } from "@/features/programs/components/ProgramForm";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Buat Program",
};

export default async function NewProgramPage() {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.PROGRAMS_CREATE)) {
    redirect("/dashboard/programs");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/programs" className="p-2 text-muted hover:text-primary bg-surface rounded-full shadow-sm ring-1 ring-border flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <PageHeader
            title="Buat Program Baru"
            description="Lengkapi detail program untuk memulai penggalangan dana."
          />
        </div>
      </div>

      <ProgramForm />
    </div>
  );
}
