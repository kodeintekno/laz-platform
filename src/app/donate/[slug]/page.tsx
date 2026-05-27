import { programsService } from "@/features/programs/services/programs.service";
import { DonationForm } from "@/features/donations/components/DonationForm";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const program = await programsService.getProgramBySlug(resolvedParams.slug);
  if (!program) return { title: "Not Found" };
  return { title: `Donasi: ${program.title}` };
}

export default async function DonatePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const program = await programsService.getProgramBySlug(resolvedParams.slug);

  if (!program || program.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <div className="bg-surface-muted min-h-screen pb-20">
      {/* Simple Public Header */}
      <header className="bg-surface shadow-soft border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-brand-primary">
            LAZ Platform
          </Link>
          <div className="flex gap-4">
            <Link href="/programs" className="text-secondary hover:text-brand-primary font-semibold">
              Eksplor Program
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <DonationForm programId={program.id} programSlug={program.slug} />
      </main>
    </div>
  );
}
