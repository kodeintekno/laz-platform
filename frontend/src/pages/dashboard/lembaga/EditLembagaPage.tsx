import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { LembagaForm } from "@/features/lembaga/components/LembagaForm";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function EditLembagaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["lembaga", id],
    queryFn: () => api.get<any>(`/lembaga/${id}`),
  });

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (isError || !result?.data) {
    navigate("/dashboard/lembaga", { replace: true });
    return null;
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader title="Ubah Data Lembaga" description="Perbarui data organisasi lembaga di sini." />
      <LembagaForm initialData={result.data} />
    </div>
  );
}
