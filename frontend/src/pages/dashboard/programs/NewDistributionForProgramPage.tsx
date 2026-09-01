import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { DistributionForm } from "@/features/distributions/components/DistributionForm";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProgramBalanceBadge } from "@/components/ui/ProgramBalanceBadge";
import { AmilBalanceBadge } from "@/components/ui/AmilBalanceBadge";

export function NewDistributionForProgramPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["programs", slug],
    queryFn: () => api.get<any>(`/programs/${slug}`),
  });

  const { data: overviewResult, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => api.get<any>("/dashboard/overview"),
  });

  if (isLoading || isOverviewLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (isError || !result?.data) {
    navigate("/dashboard/programs", { replace: true });
    return null;
  }

  const program = result.data;
  const mustahiqBalance = Number(program.programFundAmount) - Number(program.mustahiqDistributedAmount);
  const amilBalance = Number(overviewResult?.data?.metrics?.amilBalance ?? 0);

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Catat Penyaluran Dana"
        description={
          <ProgramBalanceBadge
            programTitle={program.title}
            availableBalance={mustahiqBalance}
          >
            <AmilBalanceBadge availableBalance={amilBalance} />
          </ProgramBalanceBadge>
        }
      />
      <DistributionForm
        programId={program.id}
        mustahiqBalance={mustahiqBalance}
        amilBalance={amilBalance}
      />
    </div>
  );
}
