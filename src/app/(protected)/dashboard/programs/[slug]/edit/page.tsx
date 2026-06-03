import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { programsService } from "@/features/programs/services/programs.service";
import { PERMISSIONS } from "@/constants/permissions";
import { ProgramForm } from "@/features/programs/components/ProgramForm";
import { updateProgramAction } from "@/features/programs/actions/programs.actions";

export const metadata = {
  title: "Edit Program",
};

export default async function EditProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.PROGRAMS_UPDATE)) {
    redirect("/dashboard/programs");
  }

  const resolvedParams = await params;
  const program = await programsService.getProgramBySlug(resolvedParams.slug);

  if (!program) {
    redirect("/dashboard/programs");
  }

  // Serialize Decimal to number to avoid Next.js "Only plain objects can be passed to Client Components" warning
  const serializedProgram = {
    ...program,
    targetAmount: program.targetAmount.toNumber(),
    currentAmount: program.currentAmount.toNumber(),
    distributedAmount: program.distributedAmount.toNumber(),
  };

  const updateAction = updateProgramAction.bind(null, program.id);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Edit Program</h1>
        <p className="text-sm text-secondary">
          Perbarui informasi program dan kampanye.
        </p>
      </div>

      <ProgramForm initialData={serializedProgram as any} action={updateAction} />
    </div>
  );
}
