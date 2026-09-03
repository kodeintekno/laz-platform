import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { PageHeader } from "@/components/ui";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet, Users, Activity, HeartHandshake, Building2, ClipboardList } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const fmtDt = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

export function OverviewPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const hasPlatformFinanceAccess = can(PERMISSIONS.PLATFORM_FINANCE_READ);
  const canManageLembaga = can(PERMISSIONS.LEMBAGA_MANAGE);

  const { data: result } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => api.get<any>("/dashboard/overview"),
  });

  const { data: platformResult } = useQuery({
    queryKey: ["dashboard", "platform-overview"],
    queryFn: () => api.get<any>("/dashboard/platform-overview"),
    enabled: hasPlatformFinanceAccess,
  });

  const overview = result?.data ?? {};
  const metrics = overview.metrics ?? {};
  const recentDonations = overview.recentDonations ?? [];
  const recentDistributions = overview.recentDistributions ?? [];
  const platform = platformResult?.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Selamat datang, ${user?.name || "Admin"}`}
        description="Berikut adalah ringkasan performa platform pengelolaan dana Anda."
      />

      {hasPlatformFinanceAccess && platform && (
        <div className="bg-emerald-950 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-lg">Statistik Platform (Seluruh Lembaga)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Lembaga Menunggu", value: platform.lembaga.pending, Icon: Building2 },
              { label: "Lembaga Disetujui", value: platform.lembaga.approved, Icon: Building2 },
              { label: "Total Program", value: platform.totalPrograms, Icon: ClipboardList },
              { label: "Total Relawan", value: platform.totalVolunteers, Icon: HeartHandshake },
              { label: "Total Donasi", value: fmt(platform.totalDonationsAmount), Icon: Wallet },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4">
                <Icon className="w-5 h-5 text-emerald-300 mb-2" />
                <p className="text-white font-bold text-lg">{value}</p>
                <p className="text-emerald-200/70 text-xs">{label}</p>
              </div>
            ))}
          </div>
          {canManageLembaga && platform.lembaga.pending > 0 && (
            <Link
              to="/dashboard/lembaga?status=PENDING"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-white transition"
            >
              {platform.lembaga.pending} lembaga menunggu persetujuan Anda <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Dana Terkumpul", value: fmt(metrics.totalDonations ?? 0), Icon: Wallet, colorClass: "bg-brand-primary/10 text-brand-primary" },
          { label: "Total Disalurkan", value: fmt(metrics.totalDistributed ?? 0), Icon: HeartHandshake, colorClass: "bg-success/10 text-success" },
          { label: "Program Aktif", value: metrics.activePrograms ?? 0, Icon: Activity, colorClass: "bg-warning/10 text-warning" },
          { label: "Total Pengguna", value: metrics.activeUsers ?? 0, Icon: Users, colorClass: "bg-info-token/10 text-info-token" },
        ].map(({ label, value, Icon, colorClass }) => (
          <div key={label} className="relative overflow-hidden rounded-2xl bg-surface px-4 pb-12 pt-5 sm:px-6 sm:pt-6 border border-border/40">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface rounded-2xl border border-border/40">
          <div className="p-6 border-b border-border/40 flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary">Donasi Terbaru</h2>
            <Link to="/dashboard/donations" className="text-sm font-semibold text-brand-primary hover:text-brand-secondary flex items-center gap-1">
              Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="divide-y divide-border/40">
            {recentDonations.map((d: any) => (
              <li key={d.id} className="p-6 hover:bg-surface-muted transition">
                <div className="flex justify-between gap-x-6">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-primary">
                      {d.isAnonymous ? "Hamba Allah" : d.donorName ?? "Hamba Allah"}
                    </p>
                    <p className="mt-1 truncate text-xs leading-5 text-secondary">{d.program?.title}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end">
                    <p className="text-sm leading-6 font-bold text-primary">{fmt(Number(d.amount))}</p>
                    <p className="mt-1 text-xs leading-5 text-secondary">{fmtDt(d.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
            {recentDonations.length === 0 && (
              <li className="p-6 text-center text-sm text-secondary">Belum ada donasi berhasil.</li>
            )}
          </ul>
        </div>

        <div className="bg-surface rounded-2xl border border-border/40">
          <div className="p-6 border-b border-border/40 flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary">Penyaluran Selesai</h2>
            <Link to="/dashboard/distributions" className="text-sm font-semibold text-brand-primary hover:text-brand-secondary flex items-center gap-1">
              Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="divide-y divide-border/40">
            {recentDistributions.map((d: any) => (
              <li key={d.id} className="p-6 hover:bg-surface-muted transition">
                <div className="flex justify-between gap-x-6">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-primary truncate">{d.title}</p>
                    <p className="mt-1 truncate text-xs leading-5 text-secondary">{d.program?.title}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end">
                    <p className="text-sm leading-6 font-bold text-success">{fmt(Number(d.amount))}</p>
                    <p className="mt-1 text-xs leading-5 text-secondary">{fmtDt(d.createdAt)}</p>
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
