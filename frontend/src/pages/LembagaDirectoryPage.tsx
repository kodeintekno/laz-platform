import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const fmt = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export function LembagaDirectoryPage() {
  const [search, setSearch] = useState("");

  const { data: result, isLoading } = useQuery({
    queryKey: ["public", "lembaga", "directory", search],
    queryFn: () => api.get<any[]>("/public/lembaga", { search: search || undefined, limit: 24 }),
  });

  const lembagaList = result?.data ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">Lembaga Terverifikasi</h1>
        <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
          Daftar lembaga/yayasan yang telah diverifikasi dan aktif mengelola program donasi di Ruang Berbagi.
        </p>
      </div>

      <div className="max-w-md mx-auto mb-10">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama lembaga..."
          className="w-full rounded-xl border border-border/60 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : lembagaList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lembagaList.map((l: any) => (
            <Link
              key={l.id}
              to={`/lembaga/${l.slug}`}
              className="bg-surface rounded-2xl border border-border/40 shadow-soft hover:shadow-lg hover:border-brand-primary transition p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                {l.logoUrl ? (
                  <img src={l.logoUrl} alt={l.name} className="w-12 h-12 rounded-xl object-cover border border-border/40" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center font-bold text-primary border border-border/40">
                    {l.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-primary leading-tight">{l.name}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success uppercase tracking-wide">
                    <ShieldCheck className="w-3 h-3" /> Terverifikasi
                  </span>
                </div>
              </div>
              {l.description && (
                <p className="text-sm text-secondary line-clamp-2">{l.description}</p>
              )}
              <div className="mt-auto pt-4 border-t border-border/40 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-[11px] text-secondary uppercase tracking-wide">Program</p>
                  <p className="font-bold text-primary">{l.programCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-secondary uppercase tracking-wide">Dana Terkumpul</p>
                  <p className="font-bold text-brand-primary text-sm">{fmt(l.totalCollected)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Belum Ada Lembaga" description="Belum ada lembaga terverifikasi yang cocok dengan pencarian Anda." />
      )}
    </main>
  );
}
