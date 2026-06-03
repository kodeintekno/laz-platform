import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { DistributionForm } from "@/features/distributions/components/DistributionForm";
import { programsService } from "@/features/programs/services/programs.service";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BreadcrumbOverride } from "@/providers/breadcrumb-provider";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Ajukan Penyaluran",
};

export default async function NewDistributionPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.DISTRIBUTIONS_MANAGE)) {
    redirect("/dashboard");
  }

  const resolvedParams = await params;
  const program = await programsService.getProgramBySlug(resolvedParams.slug);

  if (!program) {
    notFound();
  }

  const availableBalance = Number(program.currentAmount) - Number(program.distributedAmount);

  return (
    <div className="space-y-6 w-full">
      <BreadcrumbOverride 
        path={`/dashboard/programs/${program.slug}`} 
        label={program.title} 
      />
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <PageHeader
            title="Ajukan Penyaluran Dana"
            description={
              <>
                Program: <span className="font-semibold">{program.title}</span> (Saldo: Rp {availableBalance.toLocaleString("id-ID")})
              </>
            }
          />
        </div>
      </div>

      <DistributionForm 
        programId={program.id} 
        availableBalance={availableBalance} 
      />
    </div>
  );
}
