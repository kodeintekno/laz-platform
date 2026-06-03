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
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-4">
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
