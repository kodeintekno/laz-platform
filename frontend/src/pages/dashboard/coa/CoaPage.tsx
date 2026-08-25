import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { useSearchParams } from "react-router-dom";
import { CoaTree, type CoaAccount } from "@/features/coa/components/CoaTree";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";
import { Info, BookMarked, RefreshCw } from "lucide-react";
import { provisionCoaAction } from "@/features/coa/actions/coa.actions";
import { toast } from "@/stores/toast.store";
import { Button } from "@/components/ui/Button";

function CoaSkeletonRow({ indent = 0 }: { indent?: number }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40"
      style={{ paddingLeft: `${16 + indent * 20}px` }}
    >
      <Skeleton variant="rectangular" className="w-5 h-5 rounded" />
      <Skeleton variant="rectangular" className="w-5 h-5 rounded" />
      <Skeleton variant="text" className="w-12 h-4" />
      <Skeleton variant="text" className="flex-1 h-4 max-w-xs" />
    </div>
  );
}

function CoaSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      <div className="flex items-center gap-3 px-4 py-2 bg-surface-soft border-b border-border">
        <Skeleton variant="text" className="w-32 h-3" />
      </div>
      {/* Root accounts */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i}>
          <CoaSkeletonRow indent={0} />
          {i % 2 === 0 && (
            <>
              <CoaSkeletonRow indent={1} />
              <CoaSkeletonRow indent={2} />
              <CoaSkeletonRow indent={2} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function CoaPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const lembagaId = searchParams.get("lembagaId") ?? undefined;

  // Fetch COA — LEMBAGA_ADMIN auto-scoped, SUPER_ADMIN needs ?lembagaId=
  const params = isSuperAdmin && lembagaId ? { lembagaId } : undefined;
  const enabled = isSuperAdmin ? !!lembagaId : true;

  const { data: result, isLoading } = useQuery({
    queryKey: ["coa", { lembagaId }],
    queryFn: () => api.get<CoaAccount[]>("/coa", params),
    enabled,
  });

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: isSuperAdmin,
  });

  const accounts = result?.data ?? [];
  const totalDetail = accounts.filter((a) => !a.isHeader).length;
  const totalHeader = accounts.filter((a) => a.isHeader).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Daftar akun standar yang digunakan sebagai fondasi pencatatan keuangan lembaga."
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50/60">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          COA ini ditentukan oleh sistem dan bersifat <strong>read-only</strong>.
          Semua lembaga menggunakan template COA yang sama sebagai standar pencatatan.
          Akun dengan label <strong>Header</strong> hanya berfungsi sebagai pengelompokan
          dan tidak dapat digunakan dalam jurnal transaksi.
        </p>
      </div>

      {/* Lembaga filter for SUPER_ADMIN */}
      {isSuperAdmin && lembagasResult?.data?.length && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-secondary font-medium">Filter Lembaga:</span>
          <UserLembagaFilter lembagas={lembagasResult.data} />
        </div>
      )}

      {/* No lembaga selected (SUPER_ADMIN) */}
      {isSuperAdmin && !lembagaId && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookMarked className="w-14 h-14 text-secondary/30 mb-4" />
          <h3 className="font-semibold text-primary mb-1">Pilih Lembaga</h3>
          <p className="text-sm text-secondary max-w-xs">
            Pilih lembaga di atas untuk melihat Chart of Accounts-nya.
          </p>
        </div>
      )}

      {/* Stats & Actions */}
      {!isLoading && accounts.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-secondary">
            <span>
              <strong className="text-primary">{accounts.length}</strong> total akun
            </span>
            <span>
              <strong className="text-primary">{totalDetail}</strong> akun detail
            </span>
            <span>
              <strong className="text-primary">{totalHeader}</strong> header group
            </span>
          </div>
          
          {/* If accounts are less than the template (~60-70), show a sync button */}
          {accounts.length < 60 && (
            <SyncCoaButton lembagaId={lembagaId} />
          )}
        </div>
      )}

      {/* COA Tree */}
      {(isSuperAdmin ? !!lembagaId : true) && (
        isLoading ? <CoaSkeleton /> : <CoaTree accounts={accounts} />
      )}
    </div>
  );
}

function SyncCoaButton({ lembagaId }: { lembagaId?: string }) {
  const queryClient = useQueryClient();
  const { mutate: provision, isPending } = useMutation({
    mutationFn: () => provisionCoaAction(lembagaId),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Chart of Accounts berhasil disinkronisasi");
        queryClient.invalidateQueries({ queryKey: ["coa"] });
      } else {
        toast.error(res.error || "Gagal sinkronisasi Chart of Accounts");
      }
    },
    onError: () => toast.error("Terjadi kesalahan sistem"),
  });

  return (
    <Button 
      intent="outline" 
      size="sm" 
      onClick={() => provision()} 
      isLoading={isPending}
      className="flex items-center gap-2"
    >
      <RefreshCw className="w-4 h-4" />
      Sync COA yang Kurang
    </Button>
  );
}
