import { programsService } from "@/features/programs/services/programs.service";
import { DonationForm } from "@/features/donations/components/DonationForm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { PublicHeader, PublicFooter } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const program = await programsService.getProgramBySlug(resolvedParams.slug);
  if (!program) return { title: "Not Found" };
  return { title: `Donasi: ${program.title}` };
}

export default async function DonatePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const [program, session] = await Promise.all([
    programsService.getProgramBySlug(resolvedParams.slug),
    auth(),
  ]);

  if (!program || program.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <div className="bg-surface-muted min-h-screen flex flex-col justify-between">
      <div>
        {/* Session-aware Public Header */}
        <PublicHeader user={session?.user} />

        <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
          <DonationForm programId={program.id} programSlug={program.slug} />
        </main>
      </div>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
