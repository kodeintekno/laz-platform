import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api-client";
import { Button, EmptyState, Badge } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const fmt = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

/**
 * Form pencarian riwayat penyaluran/pengeluaran dana berdasarkan nomor telepon
 * donatur — menampilkan pengeluaran dari lembaga yang pernah didonasikan
 * (transparansi tingkat lembaga, bukan penelusuran per-donasi karena
 * Distribution tidak terikat ke donatur tertentu). Dipakai baik di halaman
 * penuh /riwayat-donasi maupun sebagai section tertanam di landing page.
 */
export function DistributionHistoryLookup({
  searchButtonLabel = "Cari Riwayat",
  inputPlaceholder = "Contoh: 081234567890",
}: {
  searchButtonLabel?: string;
  inputPlaceholder?: string;
}) {
  const [phoneInput, setPhoneInput] = useState("");
  const [searchedPhone, setSearchedPhone] = useState<string | null>(null);

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["distributions", "history", searchedPhone],
    queryFn: () => api.get<any[]>("/distributions/history", { phone: searchedPhone, limit: 50 }),
    enabled: !!searchedPhone,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.trim()) setSearchedPhone(phoneInput.trim());
  };

  const distributions = result?.data ?? [];

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

      {!isLoading && searchedPhone && !isError && distributions.length === 0 && (
        <EmptyState
          title="Tidak Ada Riwayat Penyaluran"
          description={`Belum ditemukan riwayat penyaluran dana dari lembaga yang pernah Anda donasikan untuk nomor ${searchedPhone}.`}
        />
      )}

      {distributions.length > 0 && (
        <div className="space-y-4">
          {distributions.map((d: any) => (
            <div key={d.id} className="bg-surface rounded-2xl border border-border/40 shadow-soft p-5 flex flex-col gap-2 text-left">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link to={`/programs/${d.program?.slug}`} className="font-bold text-primary hover:text-brand-primary">
                    {d.title}
                  </Link>
                  <p className="text-xs text-secondary mt-0.5">
                    {d.program?.title} &middot; oleh {d.lembaga?.name}
                  </p>
                </div>
                <Badge intent="success">Selesai</Badge>
              </div>
              <p className="text-sm text-secondary">{d.description}</p>
              <div className="flex items-end justify-between">
                <p className="text-lg font-bold text-brand-primary">{fmt(Number(d.amount))}</p>
                <p className="text-xs text-secondary">{fmtDate(d.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
