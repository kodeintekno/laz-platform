import { ArrowRight, CircleDollarSign, HandCoins, PieChart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

interface ReportingBalanceSummaryProps {
  mustahiqBalance: number;
  amilBalance: number;
}

export function ReportingBalanceSummary({
  mustahiqBalance,
  amilBalance,
}: ReportingBalanceSummaryProps) {
  const totalBalance = mustahiqBalance + amilBalance;
  const mustahiqShare = totalBalance > 0 ? (mustahiqBalance / totalBalance) * 100 : 0;
  const amilShare = totalBalance > 0 ? (amilBalance / totalBalance) * 100 : 0;

  return (
    <section
      aria-labelledby="reporting-balance-title"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-soft"
    >
      <div className="border-b border-border/60 bg-gradient-to-r from-emerald-50/80 to-transparent p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="shrink-0 rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
              <PieChart className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="reporting-balance-title" className="text-base font-bold text-primary sm:text-lg">
                  Saldo pelaporan
                </h2>
                <span className="rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Untuk penyaluran
                </span>
              </div>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-secondary">
                Dana yang belum dicatat penggunaannya kepada mustahiq atau untuk operasional amil.
              </p>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">Total belum dilaporkan</p>
            <p className="mt-1 break-words text-2xl font-bold tracking-tight text-primary tabular-nums sm:text-3xl">
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <FundBalance
            label="Dana mustahiq"
            value={mustahiqBalance}
            description="Sisa dana program yang belum disalurkan."
            share={mustahiqShare}
            Icon={HandCoins}
            tone="success"
          />
          <FundBalance
            label="Dana amil lembaga"
            value={amilBalance}
            description="Sisa dana operasional yang belum digunakan."
            share={amilShare}
            Icon={CircleDollarSign}
            tone="info"
          />
        </div>

        <div className="mt-5" aria-label="Komposisi saldo pelaporan">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-secondary">
            <span>Komposisi dana</span>
            <span className="tabular-nums">Mustahiq {mustahiqShare.toFixed(1)}% · Amil {amilShare.toFixed(1)}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-surface-soft">
            <div className="bg-success transition-[width]" style={{ width: `${mustahiqShare}%` }} />
            <div className="bg-info-token transition-[width]" style={{ width: `${amilShare}%` }} />
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-secondary">
            Pencatatan penyaluran hanya mengurangi saldo pelaporan yang dipilih.
          </p>
          <Link
            to="/dashboard/distributions"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
          >
            Kelola penyaluran
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FundBalance({
  label,
  value,
  description,
  share,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  share: number;
  Icon: LucideIcon;
  tone: "success" | "info";
}) {
  const colorClass = tone === "success"
    ? "bg-success/10 text-success"
    : "bg-info-token/10 text-info-token";

  return (
    <article className="rounded-xl border border-border/60 bg-surface-muted/60 p-4">
      <div className="flex items-center gap-2.5">
        <span className={`shrink-0 rounded-lg p-2 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-primary">{label}</p>
      </div>
      <p className="mt-4 break-words text-xl font-bold tracking-tight text-primary tabular-nums sm:text-2xl">
        {formatCurrency(value)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-secondary">{description}</p>
      <p className="mt-3 text-xs font-medium text-secondary tabular-nums">
        {share.toFixed(1)}% dari saldo pelaporan
      </p>
    </article>
  );
}
