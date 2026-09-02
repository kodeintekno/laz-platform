import { ArrowRight, CircleDollarSign, HandCoins } from "lucide-react";
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
  const mustahiqShare = totalBalance > 0 ? (mustahiqBalance / totalBalance) * 100 : 50;
  const amilShare = totalBalance > 0 ? (amilBalance / totalBalance) * 100 : 50;

  return (
    <section
      aria-labelledby="reporting-balance-title"
      className="rounded-2xl border border-border/40 bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              Dana pelaporan
            </span>
            <span className="text-xs text-secondary">Tidak mengurangi saldo penarikan</span>
          </div>
          <h2 id="reporting-balance-title" className="mt-2 text-lg font-bold text-primary">
            Saldo Penyaluran Dana
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-secondary">
            Pilih saldo utama atau saldo amil ketika mencatat penyaluran. Nilai ini menunjukkan dana yang belum dilaporkan penggunaannya.
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-xs font-medium text-secondary">Total saldo pelaporan</p>
          <p className="mt-0.5 text-2xl font-bold text-primary">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      <div
        className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-surface-soft"
        aria-label="Komposisi saldo pelaporan"
      >
        <div className="bg-success" style={{ width: `${mustahiqShare}%` }} />
        <div className="bg-brand-primary" style={{ width: `${amilShare}%` }} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <CompactFundBalance
          label="Saldo Utama / Mustahiq"
          value={mustahiqBalance}
          description="Dana program yang belum disalurkan kepada mustahiq."
          share={mustahiqShare}
          Icon={HandCoins}
          tone="success"
        />
        <CompactFundBalance
          label="Saldo Amil Lembaga"
          value={amilBalance}
          description="Dana operasional amil yang belum dilaporkan penggunaannya."
          share={amilShare}
          Icon={CircleDollarSign}
          tone="brand"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-secondary">
          Penyaluran hanya mengurangi saldo pelaporan yang dipilih, bukan saldo payment gateway.
        </p>
        <Link
          to="/dashboard/distributions"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
        >
          Kelola penyaluran <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function CompactFundBalance({
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
  Icon: typeof HandCoins;
  tone: "success" | "brand";
}) {
  const colorClass = tone === "success" ? "bg-success/10 text-success" : "bg-brand-primary/10 text-brand-primary";

  return (
    <article className="rounded-xl border border-border/40 bg-surface-soft p-4">
      <div className="flex items-center gap-2.5">
        <span className={`shrink-0 rounded-lg p-2 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-primary">{label}</p>
      </div>
      <p className="mt-3 break-words text-xl font-bold tracking-tight text-primary sm:text-2xl">
        {formatCurrency(value)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-secondary">{description}</p>
      <p className="mt-2 text-xs font-medium text-secondary">
        {share.toFixed(1)}% dari saldo pelaporan
      </p>
    </article>
  );
}
