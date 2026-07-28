import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button, EmptyState, Badge } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const fmt = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

const STATUS_LABEL: Record<string, { label: string; intent: "success" | "warning" | "destructive" | "muted" }> = {
  PAID: { label: "Berhasil", intent: "success" },
  PENDING: { label: "Menunggu Pembayaran", intent: "warning" },
  FAILED: { label: "Gagal", intent: "destructive" },
  EXPIRED: { label: "Kedaluwarsa", intent: "muted" },
};

/**
 * Form pencarian riwayat donasi berdasarkan nomor telepon + daftar hasil.
 * Dipakai baik di halaman penuh /riwayat-donasi maupun sebagai section
 * tertanam di landing page — satu sumber logic, dua tempat tampil.
 */
export function DonationHistoryLookup({
  searchButtonLabel = "Cari Riwayat",
  inputPlaceholder = "Contoh: 081234567890",
}: {
  searchButtonLabel?: string;
  inputPlaceholder?: string;
}) {
  const [phoneInput, setPhoneInput] = useState("");
  const [searchedPhone, setSearchedPhone] = useState<string | null>(null);
  const [expandedDonationId, setExpandedDonationId] = useState<string | null>(null);

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["donations", "history", searchedPhone],
    queryFn: () => api.get<any[]>("/donations/history", { phone: searchedPhone, limit: 50 }),
    enabled: !!searchedPhone,
    retry: false,
  });

  const { data: distributionResult, isLoading: isDistributionsLoading, isError: isDistributionsError } = useQuery({
    queryKey: ["distributions", "history", searchedPhone],
    queryFn: () => api.get<any[]>("/distributions/history", { phone: searchedPhone, limit: 50 }),
    enabled: !!searchedPhone,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.trim()) {
      setExpandedDonationId(null);
      setSearchedPhone(phoneInput.trim());
    }
  };

  const donations = result?.data ?? [];
  const distributions = distributionResult?.data ?? [];

  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="tel"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          placeholder={inputPlaceholder}
          className="flex-1 rounded-xl border border-border/60 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none bg-surface"
        />
        <Button type="submit" isLoading={isLoading}>
          {searchButtonLabel}
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      )}

      {isError && (
        <div className="text-center py-6 text-sm text-destructive">
          {(error as any)?.message ?? "Format nomor telepon tidak valid"}
        </div>
      )}

      {!isLoading && searchedPhone && !isError && donations.length === 0 && (
        <EmptyState
          title="Tidak Ada Riwayat Donasi"
          description={`Belum ditemukan riwayat donasi untuk nomor ${searchedPhone}.`}
        />
      )}

      {donations.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {donations.map((d: any) => {
            const statusMeta = STATUS_LABEL[d.status] ?? { label: d.status, intent: "muted" as const };
            const isExpanded = expandedDonationId === d.id;
            const donationDistributions = distributions.filter(
              (dist: any) => dist.lembaga?.slug && dist.lembaga.slug === d.lembaga?.slug
            );
            return (
              <div key={d.id} className="bg-surface rounded-2xl border border-border/40 shadow-soft p-5 flex flex-col gap-2 text-left">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link to={`/programs/${d.program?.slug}`} className="font-bold text-primary hover:text-brand-primary">
                      {d.program?.title}
                    </Link>
                    <p className="text-xs text-secondary mt-0.5">Oleh {d.lembaga?.name}</p>
                  </div>
                  <Badge intent={statusMeta.intent}>{statusMeta.label}</Badge>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-bold text-brand-primary">{fmt(Number(d.amount))}</p>
                  <p className="text-xs text-secondary">{fmtDate(d.createdAt)}</p>
                </div>
                {d.message && (
                  <p className="text-sm text-secondary italic bg-surface-muted p-2 rounded-xl border border-border/40">
                    "{d.message}"
                  </p>
                )}
                {d.status === "PAID" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpandedDonationId(isExpanded ? null : d.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline self-start mt-1"
                    >
                      Penyaluran Dana
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-3 border-t border-border/40 pt-3">
                        {donationDistributions.length > 0 && (
                          <p className="text-[11px] text-secondary">
                            Penyaluran dana dari {d.lembaga?.name} (transparansi tingkat lembaga).
                          </p>
                        )}

                        {isDistributionsLoading && (
                          <div className="flex justify-center py-4">
                            <LoadingSpinner />
                          </div>
                        )}

                        {isDistributionsError && (
                          <p className="text-xs text-destructive text-center py-2">
                            Gagal memuat data penyaluran dana. Coba lagi nanti.
                          </p>
                        )}

                        {!isDistributionsLoading && !isDistributionsError && donationDistributions.length === 0 && (
                          <p className="text-xs text-secondary text-center py-2">
                            Belum ada penyaluran dana yang tercatat dari {d.lembaga?.name ?? "lembaga ini"}.
                          </p>
                        )}

                        {donationDistributions.map((dist: any) => (
                          <div key={dist.id} className="bg-surface-muted rounded-xl border border-border/40 p-3 text-left">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-bold text-primary">{dist.title}</p>
                              <Badge intent="success">Selesai</Badge>
                            </div>
                            {dist.description && (
                              <p className="text-xs text-secondary mt-1">{dist.description}</p>
                            )}
                            <div className="flex items-end justify-between mt-2">
                              <p className="text-sm font-bold text-brand-primary">{fmt(Number(dist.amount))}</p>
                              <p className="text-xs text-secondary">{fmtDate(dist.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
