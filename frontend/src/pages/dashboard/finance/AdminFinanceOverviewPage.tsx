import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { PageHeader } from "@/components/ui";
import { Wallet, CreditCard, PieChart, Landmark, Truck, Banknote } from "lucide-react";
import { Navigate } from "react-router-dom";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export function AdminFinanceOverviewPage() {
  const { user } = useAuth();
  
  if (user?.roleName !== "SUPER_ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: result, isLoading } = useQuery({
    queryKey: ["dashboard", "platform-overview"],
    queryFn: () => api.get<any>("/dashboard/platform-overview"),
  });

  const platform = result?.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ringkasan Keuangan Platform"
        description="Pantau total donasi, pendapatan platform, dan status pencairan dana secara real-time."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-surface rounded-2xl h-32 border border-border/40"></div>
          ))}
        </div>
      ) : platform ? (
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Total Donasi Masuk", value: fmt(platform.totalDonationsAmount ?? 0), Icon: Wallet, colorClass: "bg-brand-primary/10 text-brand-primary" },
            { label: "Pembayaran Berhasil", value: `${platform.successfulPayments ?? 0} Transaksi`, Icon: CreditCard, colorClass: "bg-success/10 text-success" },
            { label: "Pendapatan Platform (12.5%)", value: fmt(platform.platformRevenue ?? 0), Icon: PieChart, colorClass: "bg-info-token/10 text-info-token" },
            { label: "Hak Lembaga (87.5%)", value: fmt(platform.institutionShare ?? 0), Icon: Landmark, colorClass: "bg-warning/10 text-warning" },
            { label: "Withdrawal Tertunda", value: fmt(platform.pendingWithdrawalsAmount ?? 0), Icon: Truck, colorClass: "bg-destructive/10 text-destructive" },
            { label: "Payout Diproses", value: fmt(platform.processingPayoutsAmount ?? 0), Icon: Banknote, colorClass: "bg-orange-500/10 text-orange-500" },
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
    </div>
  );
}
