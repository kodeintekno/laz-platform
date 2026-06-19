import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { ProgramCard, EmptyState } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function ProgramsPage() {
  const now = Date.now();
  const { data: result, isLoading } = useQuery({
    queryKey: ["public", "programs"],
    queryFn: () => api.get<any[]>("/public/programs"),
  });

  const programs = result?.data ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Pilih Program Kebaikanmu
        </h1>
        <p className="mt-4 text-lg text-secondary">
          Salurkan zakat, infak, dan sedekah Anda kepada yang membutuhkan.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : programs.length > 0 ? (
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {programs.map((program: any) => (
            <ProgramCard key={program.id} program={program} now={now} />
          ))}
        </div>
      ) : (
        <div className="max-w-md mx-auto py-8">
          <EmptyState
            title="Tidak Ada Program Ditemukan"
            description="Saat ini belum ada program penggalangan dana aktif."
          />
        </div>
      )}
    </main>
  );
}
