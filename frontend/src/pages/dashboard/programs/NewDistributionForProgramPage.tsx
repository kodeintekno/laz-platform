import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { DistributionForm } from "@/features/distributions/components/DistributionForm";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProgramBalanceBadge } from "@/components/ui/ProgramBalanceBadge";

export function NewDistributionForProgramPage() {
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
  const availableBalance = Number(program.currentAmount) - Number(program.distributedAmount);

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Catat Penyaluran Dana"
        description={
          <ProgramBalanceBadge
            programTitle={program.title}
            availableBalance={availableBalance}
          />
        }
      />
      <DistributionForm programId={program.id} availableBalance={availableBalance} />
    </div>
  );
}
