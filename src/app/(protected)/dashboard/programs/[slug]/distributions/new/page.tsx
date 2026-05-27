import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { DistributionForm } from "@/features/distributions/components/DistributionForm";
import { programsService } from "@/features/programs/services/programs.service";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BreadcrumbOverride } from "@/providers/breadcrumb-provider";

export const metadata = {
  title: "Ajukan Penyaluran | LAZ Platform",
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
    <div className="space-y-6 max-w-3xl">
      <BreadcrumbOverride 
        path={`/dashboard/programs/${program.slug}`} 
        label={program.title} 
      />
      <div className="flex items-center gap-4">
        <Link href="/dashboard/programs" className="p-2 text-text-muted hover:text-text-primary bg-surface rounded-full shadow-sm ring-1 ring-border">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold leading-6 text-text-primary">Ajukan Penyaluran Dana</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Program: <span className="font-semibold">{program.title}</span> (Saldo: Rp {availableBalance.toLocaleString("id-ID")})
          </p>
        </div>
      </div>

      <DistributionForm 
        programId={program.id} 
        availableBalance={availableBalance} 
      />
    </div>
  );
}
