import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Globe, MapPin, Phone, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { ProgramCard, EmptyState } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const fmt = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export function LembagaProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const now = Date.now();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["public", "lembaga", slug],
    queryFn: () => api.get<any>(`/public/lembaga/${slug}`),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  }

  if (isError || !result?.data) {
    navigate("/lembaga", { replace: true });
    return null;
  }

  const lembaga = result.data;
  const programs = lembaga.programs ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-surface rounded-2xl border border-border/40 shadow-soft p-8 mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {lembaga.logoUrl ? (
            <img src={lembaga.logoUrl} alt={lembaga.name} className="w-20 h-20 rounded-2xl object-cover border border-border/40" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-surface-muted flex items-center justify-center text-2xl font-bold text-primary border border-border/40">
              {lembaga.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-primary">{lembaga.name}</h1>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-success uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4" /> Terverifikasi
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-secondary">
              {lembaga.address && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {lembaga.address}</span>
              )}
              {lembaga.picPhone && (
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {lembaga.picPhone}</span>
              )}
              {lembaga.website && (
                <a href={lembaga.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-brand-primary">
                  <Globe className="w-4 h-4" /> {lembaga.website}
                </a>
              )}
            </div>
          </div>
        </div>

        {lembaga.description && (
          <p className="mt-6 text-secondary leading-relaxed whitespace-pre-wrap">{lembaga.description}</p>
        )}

        {lembaga.officePhotoUrl && (
          <img
            src={lembaga.officePhotoUrl}
            alt="Foto kantor"
            className="mt-6 w-full max-h-72 object-cover rounded-2xl border border-border/40"
          />
        )}

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-surface-muted rounded-xl p-4 text-center border border-border/40">
            <p className="text-xs text-secondary uppercase tracking-wide mb-1">Program Aktif</p>
            <p className="text-xl font-bold text-primary">{programs.length}</p>
          </div>
          <div className="bg-surface-muted rounded-xl p-4 text-center border border-border/40">
            <p className="text-xs text-secondary uppercase tracking-wide mb-1">Dana Terkumpul</p>
            <p className="text-xl font-bold text-brand-primary">{fmt(lembaga.totalCollected)}</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-primary mb-6">Program Donasi</h2>
      {programs.length > 0 ? (
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {programs.map((program: any) => (
            <ProgramCard key={program.id} program={{ ...program, lembaga: { name: lembaga.name, logoUrl: lembaga.logoUrl } }} now={now} />
          ))}
        </div>
      ) : (
        <EmptyState title="Belum Ada Program" description="Lembaga ini belum memiliki program donasi aktif." />
      )}
    </main>
  );
}
