import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { Wallet, Landmark, Truck, HeartHandshake } from "lucide-react";
import { Navigate } from "react-router-dom";
import { JournalTable } from "@/features/journal/components/JournalTable";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export function LembagaFinanceOverviewPage() {
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
        title="Ringkasan Keuangan Lembaga"
        description="Pantau saldo yang tersedia, donasi yang masuk, riwayat pencairan dana, dan mutasi jurnal Anda."
      />

      {isOverviewLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-surface rounded-2xl h-32 border border-border/40"></div>
          ))}
        </div>
      ) : metrics ? (
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Saldo Tersedia", value: fmt(metrics.availableBalance ?? 0), Icon: Wallet, colorClass: "bg-success/10 text-success" },
            { label: "Pencairan Diproses (Pending)", value: fmt(metrics.reservedBalance ?? 0), Icon: Truck, colorClass: "bg-warning/10 text-warning" },
            { label: "Total Donasi Diterima", value: fmt(metrics.totalReceived ?? 0), Icon: HeartHandshake, colorClass: "bg-brand-primary/10 text-brand-primary" },
            { label: "Total Dana Dicairkan", value: fmt(metrics.totalWithdrawn ?? 0), Icon: Landmark, colorClass: "bg-info-token/10 text-info-token" },
          ].map(({ label, value, Icon, colorClass }) => (
            <div key={label} className="relative overflow-hidden rounded-2xl bg-surface px-4 pb-12 pt-5 sm:px-6 sm:pt-6 border border-border/40 hover:shadow-sm transition">
              <dt>
                <div className={`absolute rounded-xl p-3 ${colorClass}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-secondary">{label}</p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-primary">{value}</p>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="text-center py-10 text-secondary">
          Gagal memuat data keuangan.
        </div>
      )}

      {metrics && (
        <div className="bg-surface-soft p-4 rounded-xl border border-border/40 max-w-lg">
          <h3 className="text-sm font-bold text-primary mb-2">Simulasi Saldo:</h3>
          <ul className="text-sm text-secondary space-y-1">
            <li className="flex justify-between"><span>Saldo Tersedia:</span> <span>{fmt(metrics.availableBalance ?? 0)}</span></li>
            <li className="flex justify-between text-warning"><span>Pencairan Diproses (+):</span> <span>{fmt(metrics.reservedBalance ?? 0)}</span></li>
            <li className="flex justify-between font-bold border-t border-border mt-2 pt-2 text-primary">
              <span>Total Saldo Lembaga:</span> 
              <span>{fmt((metrics.availableBalance ?? 0) + (metrics.reservedBalance ?? 0))}</span>
            </li>
          </ul>
        </div>
      )}

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
