import { programsService } from "@/features/programs/services/programs.service";
import { auth } from "@/lib/auth";
import { ProgramCard, PublicHeader, PublicFooter, EmptyState } from "@/components/ui";

export const metadata = {
  title: "Program Donasi",
  description: "Daftar program donasi, zakat, infak, dan sedekah.",
};

export default async function PublicProgramsPage() {
  const [programs, session] = await Promise.all([
    programsService.getPublishedPrograms(),
    auth(),
  ]);
  const now = Date.now();

  return (
    <div className="bg-surface-muted min-h-screen flex flex-col justify-between">
      <div>
        {/* Session-aware Public Header */}
        <PublicHeader user={session?.user} />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Pilih Program Kebaikanmu
            </h1>
            <p className="mt-4 text-lg text-secondary">
              Salurkan zakat, infak, dan sedekah Anda kepada yang membutuhkan.
            </p>
          </div>

          {programs.length > 0 ? (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
              {programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={{
                    id: program.id,
                    slug: program.slug,
                    title: program.title,
                    description: program.description,
                    imageUrl: program.imageUrl,
                    category: program.category,
                    targetAmount: Number(program.targetAmount),
                    currentAmount: Number(program.currentAmount),
                    endDate: program.endDate,
                    laz: program.laz,
                  }}
                  now={now}
                />
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto py-8">
              <EmptyState
                title="Tidak Ada Program Ditemukan"
                description="Saat ini belum ada program penggalangan dana aktif yang terdaftar di platform kami."
              />
            </div>
          )}
        </main>
      </div>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
