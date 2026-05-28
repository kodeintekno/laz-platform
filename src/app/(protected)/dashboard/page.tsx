import { auth } from "@/lib/auth";
import { analyticsService } from "@/features/analytics/services/analytics.service";
import Link from "next/link";
import { ArrowRight, Wallet, Users, Activity, HeartHandshake } from "lucide-react";

export const metadata = {
  title: "Dashboard Overview",
};

export default async function DashboardHomePage() {
  const session = await auth();
  const { metrics, recentDonations, recentDistributions } = await analyticsService.getDashboardOverview();

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold leading-7 text-primary sm:truncate sm:text-3xl sm:tracking-tight">
          Selamat datang, {session?.user?.name || "Admin"}
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Berikut adalah ringkasan performa platform pengelolaan dana Anda.
        </p>
      </div>

      {/* KPI Metrics */}
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-surface px-4 pb-12 pt-5 sm:px-6 sm:pt-6 border border-border/40">
          <dt>
            <div className="absolute rounded-xl bg-brand-primary/10 p-3">
              <Wallet className="h-6 w-6 text-brand-primary" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-secondary">Total Dana Terkumpul</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-primary">{formatRupiah(metrics.totalDonations)}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-surface px-4 pb-12 pt-5 sm:px-6 sm:pt-6 border border-border/40">
          <dt>
            <div className="absolute rounded-xl bg-success/10 p-3">
              <HeartHandshake className="h-6 w-6 text-success" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-secondary">Total Disalurkan</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-primary">{formatRupiah(metrics.totalDistributed)}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-surface px-4 pb-12 pt-5 sm:px-6 sm:pt-6 border border-border/40">
          <dt>
            <div className="absolute rounded-xl bg-warning/10 p-3">
              <Activity className="h-6 w-6 text-warning" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-secondary">Program Aktif</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-primary">{metrics.activePrograms}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-surface px-4 pb-12 pt-5 sm:px-6 sm:pt-6 border border-border/40">
          <dt>
            <div className="absolute rounded-xl bg-info-token/10 p-3">
              <Users className="h-6 w-6 text-info-token" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-secondary">Total Pengguna</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-primary">{metrics.activeUsers}</p>
          </dd>
        </div>
      </dl>

      {/* Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Donations */}
        <div className="bg-surface rounded-2xl border border-border/40">
          <div className="p-6 border-b border-border/40 flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary">Donasi Terbaru</h2>
            <Link href="/dashboard/donations" className="text-sm font-semibold text-brand-primary hover:text-brand-secondary flex items-center gap-1">
              Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="divide-y divide-border/40">
            {recentDonations.map((donation) => (
              <li key={donation.id} className="p-6 hover:bg-surface-muted transition">
                <div className="flex justify-between gap-x-6">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-primary">
                      {donation.isAnonymous ? "Hamba Allah" : donation.user?.name || "Hamba Allah"}
                    </p>
                    <p className="mt-1 truncate text-xs leading-5 text-secondary">{donation.program.title}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end">
                    <p className="text-sm leading-6 font-bold text-primary">{formatRupiah(Number(donation.amount))}</p>
                    <p className="mt-1 text-xs leading-5 text-secondary">{formatDate(donation.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
            {recentDonations.length === 0 && (
              <li className="p-6 text-center text-sm text-secondary">Belum ada donasi berhasil.</li>
            )}
          </ul>
        </div>

        {/* Recent Distributions */}
        <div className="bg-surface rounded-2xl border border-border/40">
          <div className="p-6 border-b border-border/40 flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary">Penyaluran Selesai</h2>
            <Link href="/dashboard/distributions" className="text-sm font-semibold text-brand-primary hover:text-brand-secondary flex items-center gap-1">
              Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="divide-y divide-border/40">
            {recentDistributions.map((dist) => (
              <li key={dist.id} className="p-6 hover:bg-surface-muted transition">
                <div className="flex justify-between gap-x-6">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-primary truncate">
                      {dist.title}
                    </p>
                    <p className="mt-1 truncate text-xs leading-5 text-secondary">{dist.program.title}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end">
                    <p className="text-sm leading-6 font-bold text-success">{formatRupiah(Number(dist.amount))}</p>
                    <p className="mt-1 text-xs leading-5 text-secondary">{formatDate(dist.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
            {recentDistributions.length === 0 && (
              <li className="p-6 text-center text-sm text-secondary">Belum ada penyaluran selesai.</li>
            )}
          </ul>
        </div>

      </div>
    </div>
  );
}
