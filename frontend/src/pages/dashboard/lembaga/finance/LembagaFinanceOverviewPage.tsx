import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowDownToLine,
  HandCoins,
  HeartHandshake,
  Landmark,
  ReceiptText,
  Truck,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { JournalTable } from "@/features/journal/components/JournalTable";
import { ReportingBalanceSummary } from "./ReportingBalanceSummary";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

export function LembagaFinanceOverviewPage() {
  const { user } = useAuth();
  const lembagaId = user?.lembagaId;

  const { data: result, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => api.get<any>("/dashboard/overview"),
    enabled: Boolean(lembagaId),
  });

  const { data: journalResult, isLoading: isJournalLoading } = useQuery({
    queryKey: ["journal", { page: 1, limit: 10, lembagaId }],
    queryFn: () => api.get<any>("/journal", { page: 1, limit: 10, lembagaId }),
    enabled: Boolean(lembagaId),
  });

  if (!lembagaId) {
    return <Navigate to="/dashboard" replace />;
  }

  const metrics = result?.data?.metrics;
  const journals = journalResult?.data ?? [];
  const mustahiqBalance = Number(metrics?.mustahiqBalance ?? 0);
  const amilBalance = Number(metrics?.amilBalance ?? 0);
  const availableGateway = Number(metrics?.availableBalance ?? 0);
  const reservedGateway = Number(metrics?.reservedBalance ?? 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ringkasan Keuangan Lembaga"
        description="Lihat saldo dana pelaporan dan saldo payment gateway dalam kelompok yang terpisah."
      />

      {isOverviewLoading ? (
        <FinanceOverviewSkeleton />
      ) : metrics ? (
        <>
          <ReportingBalanceSummary
            mustahiqBalance={mustahiqBalance}
            amilBalance={amilBalance}
          />

          <section aria-labelledby="gateway-balance-title" className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 to-emerald-800 p-6 text-white shadow-sm sm:p-7 lg:col-span-3">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-24 right-20 h-48 w-48 rounded-full bg-emerald-400/10" />

              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/10 p-2.5"><Wallet className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">Payment gateway</p>
                      <h2 id="gateway-balance-title" className="text-lg font-bold">Saldo Penarikan</h2>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50">Terpisah dari pelaporan</span>
                </div>

                <div className="mt-8">
                  <p className="text-sm text-emerald-100">Tersedia untuk ditarik</p>
                  <p className="mt-1 break-words text-3xl font-bold tracking-tight sm:text-4xl">{fmt(availableGateway)}</p>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <GatewayMetric label="Sedang diproses" value={reservedGateway} Icon={Truck} />
                  <GatewayMetric label="Total di gateway" value={availableGateway + reservedGateway} Icon={Landmark} />
                </div>

                <Link
                  to="/dashboard/withdrawals/mine"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                >
                  <ArrowDownToLine className="h-4 w-4" /> Ajukan penarikan
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-border/40 bg-surface p-6 sm:p-7 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-info-token/10 p-2.5 text-info-token"><ReceiptText className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-secondary">Historis</p>
                  <h2 className="text-lg font-bold text-primary">Aktivitas Keuangan</h2>
                </div>
              </div>

              <dl className="mt-6 divide-y divide-border/40">
                <ActivityMetric label="Total donasi diterima" value={metrics.totalReceived ?? 0} Icon={HeartHandshake} />
                <ActivityMetric label="Total dana disalurkan" value={metrics.totalDistributed ?? 0} Icon={HandCoins} />
                <ActivityMetric label="Total dana ditarik" value={metrics.totalWithdrawn ?? 0} Icon={Landmark} />
              </dl>
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-border/40 bg-surface py-12 text-center text-secondary">
          Gagal memuat data keuangan.
        </div>
      )}

      <section aria-labelledby="recent-journals-title" className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Audit trail</p>
          <h2 id="recent-journals-title" className="mt-1 text-lg font-bold text-primary">Mutasi Jurnal Terbaru</h2>
          <p className="mt-1 text-sm text-secondary">Sepuluh transaksi terakhir yang tercatat dalam sistem akuntansi lembaga.</p>
        </div>

        {isJournalLoading ? (
          <TableSkeleton
            headers={["No. Bukti", "Tanggal", "Tipe", "Total Debit", "Total Kredit"]}
            rowCount={5}
            columnTypes={["text", "text", "text", "text", "text"]}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
            <JournalTable journals={journals} pagination={{ currentPage: 1, totalPages: 1, totalCount: journals.length, pageSize: 10 }} />
          </div>
        )}
      </section>
    </div>
  );
}

function GatewayMetric({ label, value, Icon }: { label: string; value: number; Icon: typeof Truck }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3.5">
      <div className="flex items-center gap-2 text-emerald-100"><Icon className="h-4 w-4" /><span className="text-xs">{label}</span></div>
      <p className="mt-2 break-words text-sm font-bold sm:text-base">{fmt(value)}</p>
    </div>
  );
}

function ActivityMetric({ label, value, Icon }: { label: string; value: number; Icon: typeof Landmark }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <dt className="flex items-center gap-2.5 text-sm text-secondary"><Icon className="h-4 w-4" />{label}</dt>
      <dd className="text-right text-sm font-bold text-primary">{fmt(value)}</dd>
    </div>
  );
}

function FinanceOverviewSkeleton() {
  return (
    <div className="space-y-5" aria-label="Memuat ringkasan keuangan">
      <div className="h-80 animate-pulse rounded-3xl border border-border/40 bg-surface" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="h-80 animate-pulse rounded-3xl bg-surface-soft lg:col-span-3" />
        <div className="h-80 animate-pulse rounded-3xl border border-border/40 bg-surface lg:col-span-2" />
      </div>
    </div>
  );
}
