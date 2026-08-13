import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { PageHeader, Breadcrumbs, Skeleton } from "@/components/ui";
import { JournalForm } from "@/features/journal/components/JournalForm";

export function NewJournalPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const lembagaId = searchParams.get("lembagaId") ?? undefined;

  const params = isSuperAdmin && lembagaId ? { lembagaId } : undefined;
  const enabled = isSuperAdmin ? !!lembagaId : true;

  // Fetch COA Accounts for this lembaga
  const { data: coaResult, isLoading: loadingCoa } = useQuery({
    queryKey: ["coa", { lembagaId }],
    queryFn: () => api.get<any[]>("/coa", params),
    enabled,
  });

  // Fetch Programs for this lembaga
  const { data: programsResult, isLoading: loadingPrograms } = useQuery({
    queryKey: ["programs", { lembagaId }],
    queryFn: () => api.get<any[]>("/programs", { ...params, limit: 100 }), // Get all active programs
    enabled,
  });

  const isLoading = loadingCoa || loadingPrograms;
  const accounts = coaResult?.data ?? [];
  const programs = programsResult?.data ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <PageHeader
        title="Buat Draft Jurnal"
        description="Catat transaksi manual baru. Jurnal yang dibuat akan berstatus DRAFT dan dapat diedit sebelum diposting."
      />

      {isLoading ? (
        <Skeleton variant="rectangular" className="h-96 w-full rounded-xl" />
      ) : accounts.length === 0 ? (
        <div className="p-6 bg-warning/10 border border-warning/20 rounded-xl text-warning-token">
          <h3 className="font-bold mb-2">COA Belum Tersedia</h3>
          <p className="text-sm">Silakan hubungi administrator untuk melakukan setup Chart of Accounts (COA) untuk lembaga Anda sebelum membuat jurnal.</p>
        </div>
      ) : (
        <JournalForm 
          accounts={accounts} 
          programs={programs} 
          lembagaId={isSuperAdmin ? lembagaId : undefined} 
        />
      )}
    </div>
  );
}
