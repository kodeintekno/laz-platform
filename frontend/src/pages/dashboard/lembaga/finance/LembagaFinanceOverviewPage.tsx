import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowRight,
  CircleDollarSign,
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
  const reportingBalance = mustahiqBalance + amilBalance;
  const mustahiqShare = reportingBalance > 0 ? (mustahiqBalance / reportingBalance) * 100 : 50;
  const amilShare = reportingBalance > 0 ? (amilBalance / reportingBalance) * 100 : 50;
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
          <section aria-labelledby="reporting-balance-title" className="overflow-hidden rounded-3xl border border-border/40 bg-surface">
            <div className="border-b border-border/40 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">Dana pelaporan</span>
                    <span className="text-xs text-secondary">Tidak mengurangi saldo penarikan</span>
                  </div>
                  <h2 id="reporting-balance-title" className="mt-3 text-xl font-bold text-primary">Saldo Penyaluran Dana</h2>
                  <p className="mt-1 max-w-2xl text-sm text-secondary">
                    Pilih saldo utama atau saldo amil ketika mencatat penyaluran. Nilai ini menunjukkan dana yang belum dilaporkan penggunaannya.
                  </p>
                </div>
                <div className="lg:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-secondary">Total saldo pelaporan</p>
                  <p className="mt-1 text-2xl font-bold text-primary sm:text-3xl">{fmt(reportingBalance)}</p>
                </div>
              </div>

              <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-soft" aria-label="Komposisi saldo pelaporan">
                <div className="bg-success transition-all" style={{ width: `${mustahiqShare}%` }} />
                <div className="bg-brand-primary transition-all" style={{ width: `${amilShare}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-px bg-border/40 md:grid-cols-2">
              <FundBalanceCard
                label="Saldo Utama / Mustahiq"
                value={mustahiqBalance}
                description="Dana program yang belum disalurkan kepada mustahiq."
                helper={`${mustahiqShare.toFixed(1)}% dari saldo pelaporan`}
                Icon={HandCoins}
                tone="success"
              />
              <FundBalanceCard
                label="Saldo Amil Lembaga"
                value={amilBalance}
                description="Dana operasional amil yang belum dilaporkan penggunaannya."
                helper={`${amilShare.toFixed(1)}% dari saldo pelaporan`}
                Icon={CircleDollarSign}
                tone="brand"
              />
            </div>

            <div className="flex flex-col gap-3 bg-surface-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-xs text-secondary">
                Penyaluran hanya mengurangi saldo pelaporan yang dipilih, bukan saldo payment gateway.
              </p>
              <Link to="/dashboard/distributions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline">
                Kelola penyaluran <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

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

function FundBalanceCard({
  label,
  value,
  description,
  helper,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  helper: string;
  Icon: typeof HandCoins;
  tone: "success" | "brand";
}) {
  const iconClass = tone === "success" ? "bg-success/10 text-success" : "bg-brand-primary/10 text-brand-primary";
  const dotClass = tone === "success" ? "bg-success" : "bg-brand-primary";

  return (
    <div className="bg-surface p-5 sm:p-7">
      <div className="flex items-start gap-4">
        <div className={`shrink-0 rounded-2xl p-3 ${iconClass}`}><Icon className="h-6 w-6" /></div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">{label}</p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-primary sm:text-3xl">{fmt(value)}</p>
          <p className="mt-2 text-sm leading-relaxed text-secondary">{description}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-secondary">
            <span className={`h-2 w-2 rounded-full ${dotClass}`} />{helper}
          </p>
        </div>
      </div>
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
