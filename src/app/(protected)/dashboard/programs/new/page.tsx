import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { ProgramForm } from "@/features/programs/components/ProgramForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Buat Program | LAZ Platform",
};

export default async function NewProgramPage() {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.PROGRAMS_CREATE)) {
    redirect("/dashboard/programs");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/programs" className="p-2 text-text-muted hover:text-text-primary bg-surface rounded-full shadow-sm ring-1 ring-border">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold leading-6 text-text-primary">Buat Program Baru</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Lengkapi detail program untuk memulai penggalangan dana.
          </p>
        </div>
      </div>

      <ProgramForm />
    </div>
  );
}
