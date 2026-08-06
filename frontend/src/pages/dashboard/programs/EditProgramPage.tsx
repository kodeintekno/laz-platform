import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { ProgramForm } from "@/features/programs/components/ProgramForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { updateProgramAction } from "@/features/programs/actions/programs.actions";

export function EditProgramPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["programs", slug],
    queryFn: () => api.get<any>(`/programs/${slug}`),
  });

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (isError || !result?.data) {
    navigate("/dashboard/programs", { replace: true });
    return null;
  }

  const program = result.data;
  const serialized = {
    ...program,
    targetAmount: Number(program.targetAmount),
    currentAmount: Number(program.currentAmount),
    distributedAmount: Number(program.distributedAmount),
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Edit Program</h1>
        <p className="text-sm text-secondary">Perbarui informasi program dan kampanye.</p>
      </div>
      <ProgramForm
        initialData={serialized}
        action={(_prevState: any, formData: FormData) => updateProgramAction(program.id, formData)}
      />
    </div>
  );
}

