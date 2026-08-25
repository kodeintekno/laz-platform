import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { PageHeader } from "@/components/ui";
import { Link } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  PieChart,
  Landmark,
  Truck,
  Banknote,
  ArrowRight,
  Building2,
  TrendingUp,
  Coins,
  ArrowDownToLine,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

/* ─────────────────────────── Skeleton ─────────────────────────── */
function StatSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-${count <= 4 ? 4 : 3}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-surface rounded-2xl h-32 border border-border/40"
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── Stat Card ─────────────────────────── */
function StatCard({
  label,
  value,
  Icon,
  colorClass,
  sub,
}: {
  label: string;
  value: string | number;
  Icon: React.ElementType;
  colorClass: string;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface px-4 pb-10 pt-5 sm:px-6 sm:pt-6 border border-border/40 hover:shadow-md transition-shadow">
      <dt>
        <div className={`absolute rounded-xl p-3 ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="ml-16 truncate text-sm font-medium text-secondary">
          {label}
        </p>
      </dt>
      <dd className="ml-16 flex flex-col pb-4 sm:pb-5">
        <p className="text-2xl font-semibold text-primary mt-1">{value}</p>
        {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
      </dd>
    </div>
  );
}

/* ═══════════════════════ SUPER ADMIN VIEW ══════════════════════════ */
function SuperAdminOverview() {
  const { data: result, isLoading } = useQuery({
    queryKey: ["dashboard", "platform-overview"],
    queryFn: () => api.get<any>("/dashboard/platform-overview"),
  });

  const p = result?.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ringkasan Keuangan Platform"
        description="Pantau total donasi, pendapatan platform, dan status pencairan dana secara real-time di seluruh lembaga."
      />

      {/* Platform stats banner */}
      {!isLoading && p && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950 to-emerald-900 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-emerald-300" />
            <h2 className="text-white font-bold text-base">
              Statistik Lembaga
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Menunggu", value: p.lembaga.pending, color: "text-amber-300" },
              { label: "Disetujui", value: p.lembaga.approved, color: "text-emerald-300" },
              { label: "Ditolak", value: p.lembaga.rejected, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-white/60 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
          {p.lembaga.pending > 0 && (
            <Link
              to="/dashboard/lembaga?status=PENDING"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-white transition"
            >
              <AlertTriangle className="w-4 h-4" />
              {p.lembaga.pending} lembaga menunggu persetujuan
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      {/* Main KPI cards */}
      {isLoading ? (
        <StatSkeleton count={6} />
      ) : p ? (
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Donasi Masuk"
            value={fmt(p.totalDonationsAmount ?? 0)}
            Icon={Wallet}
            colorClass="bg-brand-primary/10 text-brand-primary"
            sub={`${p.successfulPayments ?? 0} transaksi berhasil`}
          />
          <StatCard
            label="Pendapatan Platform (12.5%)"
            value={fmt(p.platformRevenue ?? 0)}
            Icon={PieChart}
            colorClass="bg-info-token/10 text-info-token"
          />
          <StatCard
            label="Hak Lembaga (87.5%)"
            value={fmt(p.institutionShare ?? 0)}
            Icon={Landmark}
            colorClass="bg-success/10 text-success"
          />
          <StatCard
            label="Withdrawal Tertunda"
            value={fmt(p.pendingWithdrawalsAmount ?? 0)}
            Icon={Truck}
            colorClass="bg-destructive/10 text-destructive"
            sub="Menunggu diproses"
          />
          <StatCard
            label="Payout Diproses"
            value={fmt(p.processingPayoutsAmount ?? 0)}
            Icon={Banknote}
            colorClass="bg-orange-500/10 text-orange-500"
            sub="Dalam proses transfer"
          />
          <StatCard
            label="Total Program"
            value={p.totalPrograms ?? 0}
            Icon={ClipboardList}
            colorClass="bg-violet-500/10 text-violet-500"
          />
        </dl>
      ) : (
        <div className="text-center py-10 text-secondary">
          Gagal memuat data keuangan.
        </div>
      )}

      {/* Quick links */}
      {!isLoading && p && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Kelola Withdrawals", to: "/dashboard/withdrawals", icon: Truck },
            { label: "Lihat Payouts", to: "/dashboard/payouts", icon: Banknote },
          ].map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border/40 hover:border-brand-primary/40 hover:shadow-sm transition group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2 bg-brand-primary/10">
                  <Icon className="w-5 h-5 text-brand-primary" />
                </div>
                <span className="text-sm font-semibold text-primary">{label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-secondary group-hover:text-brand-primary transition" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ LEMBAGA VIEW ══════════════════════════ */
function LembagaOverview() {
  const { user } = useAuth();

  const { data: result, isLoading } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => api.get<any>("/dashboard/overview"),
  });

  const metrics = result?.data?.metrics;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ringkasan Keuangan Lembaga"
        description="Pantau saldo, donasi yang masuk, dan status pencairan dana lembaga Anda."
      />

      {/* Saldo hero card */}
      {!isLoading && metrics && (
        <div className="rounded-2xl overflow-hidden border border-border/40 bg-surface flex flex-col md:flex-row">
          <div className="flex-1 p-8 bg-gradient-to-br from-brand-primary/10 to-transparent border-b md:border-b-0 md:border-r border-border/40">
            <p className="text-sm font-semibold text-secondary mb-1">
              Total Saldo Lembaga
            </p>
            <h2 className="text-4xl font-bold text-primary mb-3">
              {fmt(
                (metrics.availableBalance ?? 0) +
                  (metrics.reservedBalance ?? 0)
              )}
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success text-xs font-semibold px-3 py-1">
              Hak Lembaga 87.5%
            </span>
          </div>
          <div className="flex-1 p-8 space-y-4">
            {[
              {
                label: "Saldo Tersedia (dapat ditarik)",
                value: fmt(metrics.availableBalance ?? 0),
                cls: "text-success",
              },
              {
                label: "Saldo Tertunda (sedang ditarik)",
                value: fmt(metrics.reservedBalance ?? 0),
                cls: "text-warning",
              },
              {
                label: "Total Dicairkan (historis)",
                value: fmt(metrics.totalWithdrawn ?? 0),
                cls: "text-info-token",
              },
            ].map(({ label, value, cls }) => (
              <div
                key={label}
                className="flex justify-between items-center border-b last:border-0 border-border/40 pb-3 last:pb-0"
              >
                <span className="text-sm text-secondary">{label}</span>
                <span className={`text-base font-bold ${cls}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI cards */}
      {isLoading ? (
        <StatSkeleton count={4} />
      ) : metrics ? (
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Saldo Tersedia"
            value={fmt(metrics.availableBalance ?? 0)}
            Icon={Wallet}
            colorClass="bg-success/10 text-success"
          />
          <StatCard
            label="Pencairan Tertunda"
            value={fmt(metrics.reservedBalance ?? 0)}
            Icon={Truck}
            colorClass="bg-warning/10 text-warning"
          />
          <StatCard
            label="Total Donasi Diterima"
            value={fmt(metrics.totalReceived ?? 0)}
            Icon={TrendingUp}
            colorClass="bg-brand-primary/10 text-brand-primary"
          />
          <StatCard
            label="Total Dana Dicairkan"
            value={fmt(metrics.totalWithdrawn ?? 0)}
            Icon={Coins}
            colorClass="bg-info-token/10 text-info-token"
          />
        </dl>
      ) : (
        <div className="text-center py-10 text-secondary">
          Gagal memuat data keuangan.
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: "Ajukan Withdrawal",
            desc: "Cairkan saldo tersedia ke rekening bank Anda",
            to: "/dashboard/withdrawals/mine",
            icon: ArrowDownToLine,
          },
          {
            label: "Kelola Bank Account",
            desc: "Tambah atau ubah rekening tujuan pencairan",
            to: "/dashboard/lembaga/finance/bank-account",
            icon: CreditCard,
          },
        ].map(({ label, desc, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-surface border border-border/40 hover:border-brand-primary/40 hover:shadow-sm transition group"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl p-2.5 bg-brand-primary/10 shrink-0">
                <Icon className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">{label}</p>
                <p className="text-xs text-secondary mt-0.5">{desc}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-secondary group-hover:text-brand-primary transition shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN EXPORT ══════════════════════════ */
export function FinanceOverviewPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  return isSuperAdmin ? <SuperAdminOverview /> : <LembagaOverview />;
}
