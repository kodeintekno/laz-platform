import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { DonationForm } from "@/features/donations/components/DonationForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function DonatePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["public", "programs", slug],
    queryFn: () => api.get<any>(`/public/programs/${slug}`),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  }

  const program = result?.data;
  if (isError || !program || program.status !== "PUBLISHED") {
    navigate("/programs", { replace: true });
    return null;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <DonationForm programId={program.id} programSlug={program.slug} />
    </main>
  );
}
