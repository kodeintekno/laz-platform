import { ProgramForm } from "@/features/programs/components/ProgramForm";
import { PageHeader } from "@/components/ui";

export function NewProgramPage() {
  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Buat Program Baru"
        description="Lengkapi detail program untuk memulai penggalangan dana."
      />
      <ProgramForm />
    </div>
  );
}
