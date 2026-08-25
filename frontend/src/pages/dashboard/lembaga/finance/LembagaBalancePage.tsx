import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { PageHeader, TableSkeleton, Badge } from "@/components/ui";
import { Navigate } from "react-router-dom";
import { JournalTable } from "@/features/journal/components/JournalTable";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export function LembagaBalancePage() {
  const { user } = useAuth();
  
  if (!user?.lembagaId) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: result, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => api.get<any>("/dashboard/overview"),
  });

  const { data: journalResult, isLoading: isJournalLoading } = useQuery({
    queryKey: ["journal", { page: 1, limit: 10, lembagaId: user.lembagaId }],
    queryFn: () => api.get<any>("/journal", { page: 1, limit: 10, lembagaId: user.lembagaId }),
  });

  const metrics = result?.data?.metrics;
  const journals = journalResult?.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Saldo & Mutasi"
        description="Detail saldo lembaga Anda beserta catatan mutasi (jurnal) terbaru."
      />

      {isOverviewLoading ? (
        <div className="animate-pulse bg-surface rounded-2xl h-32 border border-border/40"></div>
      ) : metrics ? (
        <div className="bg-surface rounded-2xl border border-border/40 overflow-hidden flex flex-col md:flex-row">
          <div className="p-8 flex-1 border-b md:border-b-0 md:border-r border-border/40 bg-gradient-to-br from-brand-primary/5 to-transparent">
            <p className="text-sm font-semibold text-secondary mb-2">Total Saldo (Tersedia + Tertunda)</p>
            <h2 className="text-4xl font-bold text-primary mb-4">
              {fmt((metrics.availableBalance ?? 0) + (metrics.reservedBalance ?? 0))}
            </h2>
            <div className="flex items-center gap-2">
              <Badge intent="success">Hak Lembaga (87.5%)</Badge>
              <span className="text-xs text-secondary">Dari total {fmt(metrics.totalReceived ?? 0)} yang diterima.</span>
            </div>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-center space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-secondary">Saldo Tersedia (Bisa ditarik)</span>
              <span className="text-lg font-bold text-success">{fmt(metrics.availableBalance ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-secondary">Saldo Tertunda (Sedang ditarik)</span>
              <span className="text-lg font-bold text-warning">{fmt(metrics.reservedBalance ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border/40 pt-4 mt-2">
              <span className="text-sm font-medium text-secondary">Total Dana Dicairkan (Historis)</span>
              <span className="text-lg font-bold text-info-token">{fmt(metrics.totalWithdrawn ?? 0)}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-primary">Riwayat Mutasi Jurnal Terbaru</h3>
        <p className="text-sm text-secondary">Hanya menampilkan 10 transaksi terakhir yang tercatat di sistem akuntansi.</p>
        
        {isJournalLoading ? (
          <TableSkeleton
            headers={["No. Bukti", "Tanggal", "Tipe", "Total Debit", "Total Kredit"]}
            rowCount={5}
            columnTypes={["text", "text", "text", "text", "text"]}
          />
        ) : (
          <div className="bg-surface rounded-2xl border border-border/40">
            <JournalTable journals={journals} pagination={{ currentPage: 1, totalPages: 1, totalCount: journals.length, pageSize: 10 }} />
          </div>
        )}
      </div>
    </div>
  );
}
