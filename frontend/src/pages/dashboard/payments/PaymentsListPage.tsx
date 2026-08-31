import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { PaymentTable } from "@/features/payments/components/PaymentTable";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";
import { Button } from "@/components/ui";
import { Play } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function PaymentsListPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const queryClient = useQueryClient();
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      await api.post("/dev/simulate/payment");
      alert("Simulasi pembayaran berhasil!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lembagaId = searchParams.get("lembagaId") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["payments", { page, limit, search, lembagaId }],
    queryFn: () => api.get<any[]>("/payments", { page, limit, search, lembagaId }),
  });

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: isSuperAdmin,
  });

  const payments = (result?.data ?? []).map((p: any) => ({
    ...p,
    amount: Number(p.amount),
    donation: p.donation ? { ...p.donation, amount: Number(p.donation.amount) } : null,
  }));

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pembayaran"
        description="Kelola transaksi pembayaran donasi, detail invoice, dan integrasi payment gateway."
        action={
          <Button 
            onClick={handleSimulate} 
            disabled={isSimulating}
            intent="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isSimulating ? "Menyimulasikan..." : "Simulate Xendit (Paid)"}
          </Button>
        }
      />

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari invoice, program, atau donatur..."
        filterSlot={
          isSuperAdmin && lembagasResult?.data?.length ? (
            <UserLembagaFilter lembagas={lembagasResult.data} />
          ) : undefined
        }
      />

      {isLoading ? (
        <TableSkeleton
          headers={["Invoice / Ref", "Program", "Donatur", "Nominal", "Metode", "Status", "Tanggal"]}
          rowCount={limit}
          columnTypes={["text", "text", "avatar", "text", "text", "text", "text"]}
        />
      ) : (
        <PaymentTable payments={payments as any} pagination={pagination} />
      )}
    </div>
  );
}
