import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Link } from "react-router-dom";

const fmt = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d));

export function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const now = Date.now();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["public", "programs", slug],
    queryFn: () => api.get<any>(`/public/programs/${slug}`),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  }

  if (isError || !result?.data) {
    navigate("/programs", { replace: true });
    return null;
  }

  const program = result.data;
  const currentAmount = Number(program.currentAmount);
  const targetAmount = Number(program.targetAmount);
  const progress = Math.min(100, Math.round((currentAmount / targetAmount) * 100));
  const daysLeft = program.endDate
    ? Math.max(0, Math.ceil((new Date(program.endDate).getTime() - now) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-surface rounded-2xl shadow-soft border border-border/40 overflow-hidden lg:flex">
        <div className="lg:w-7/12 relative aspect-[4/3] lg:aspect-auto bg-surface-soft">
          {program.imageUrl ? (
            <img src={program.imageUrl} alt={program.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">Tidak ada gambar</div>
          )}
          <div className="absolute top-4 left-4 bg-brand-primary px-3 py-1.5 rounded-xl text-xs font-bold text-white">
            {program.category}
          </div>
        </div>

        <div className="lg:w-5/12 p-6 lg:p-8 flex flex-col">
          {program.laz && (
            <div className="flex items-center gap-3 mb-5 p-3.5 bg-surface-muted rounded-xl border border-border/50">
              {program.laz.logoUrl ? (
                <img src={program.laz.logoUrl} alt={program.laz.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-sm font-bold border border-border/50">
                  {program.laz.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs text-secondary font-medium">Penggalang Dana</p>
                <p className="text-sm font-bold text-primary">{program.laz.name}</p>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-bold text-primary mb-6 leading-tight">{program.title}</h1>

          <div className="mb-6">
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold text-brand-primary">{fmt(currentAmount)}</span>
              <span className="text-sm text-secondary mb-1">dari {fmt(targetAmount)}</span>
            </div>
            <div className="w-full bg-surface-soft rounded-full h-2.5">
              <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-surface-muted p-4 rounded-2xl border border-border/40 text-center">
              <p className="text-sm text-secondary mb-1">Donatur</p>
              <p className="text-xl font-bold text-primary">{program._count?.donations ?? 0}</p>
            </div>
            <div className="bg-surface-muted p-4 rounded-2xl border border-border/40 text-center">
              <p className="text-sm text-secondary mb-1">Sisa Waktu</p>
              <p className="text-xl font-bold text-primary">{daysLeft !== null ? `${daysLeft} Hari` : "∞"}</p>
            </div>
          </div>

          <div className="mt-auto">
            <Link
              to={`/donate/${program.slug}`}
              className="block w-full rounded-xl bg-brand-primary px-3 py-4 text-center text-lg font-bold text-white hover:bg-brand-secondary transition"
            >
              Donasi Sekarang
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface rounded-2xl shadow-soft border border-border/40 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-primary mb-4 pb-4 border-b border-border/40">Cerita Penggalangan Dana</h2>
          <div className="prose prose-emerald max-w-none text-secondary whitespace-pre-wrap">{program.description}</div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-surface rounded-2xl shadow-soft border border-border/40 p-6">
            <h2 className="text-lg font-bold text-primary mb-4 pb-4 border-b border-border/40">Donasi Terbaru</h2>
            <div className="space-y-4">
              {(program.donations ?? []).length > 0 ? (
                program.donations.map((d: any) => (
                  <div key={d.id} className="flex gap-4 items-start">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                      {d.isAnonymous || !d.user?.name ? "H" : d.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">
                        {d.isAnonymous ? "Hamba Allah" : d.user?.name ?? "Hamba Allah"}
                      </p>
                      <p className="text-sm font-semibold text-brand-primary">{fmt(Number(d.amount))}</p>
                      <p className="text-xs text-secondary mt-0.5">{fmtDate(d.createdAt)}</p>
                      {d.message && (
                        <p className="text-sm text-secondary italic mt-2 bg-surface-muted p-2 rounded-xl border border-border/40">
                          "{d.message}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-secondary text-center py-4">Belum ada donasi. Jadilah yang pertama!</p>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-2xl shadow-soft border border-border/40 p-6">
            <h2 className="text-lg font-bold text-primary mb-4 pb-4 border-b border-border/40">Kabar Penyaluran</h2>
            <div className="space-y-6">
              {(program.distributions ?? []).filter((d: any) => d.status === "COMPLETED").length > 0 ? (
                program.distributions
                  .filter((d: any) => d.status === "COMPLETED")
                  .map((dist: any) => (
                    <div key={dist.id} className="border-l-2 border-brand-accent/30 pl-4 relative">
                      <div className="absolute w-3 h-3 bg-brand-primary rounded-full -left-[7px] top-1.5" />
                      <p className="text-xs text-secondary mb-1">{fmtDate(dist.createdAt)}</p>
                      <h3 className="text-sm font-bold text-primary">{dist.title}</h3>
                      <p className="text-sm font-bold text-success my-1">Tersalurkan: {fmt(Number(dist.amount))}</p>
                      <p className="text-sm text-secondary line-clamp-3">{dist.description}</p>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-secondary text-center py-4">Belum ada kabar penyaluran dana.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
