import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { LazForm } from "@/features/laz/components/LazForm";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function EditLazPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["laz", id],
    queryFn: () => api.get<any>(`/laz/${id}`),
  });

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (isError || !result?.data) {
    navigate("/dashboard/laz", { replace: true });
    return null;
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader title="Ubah Data LAZ" description="Perbarui data organisasi LAZ di sini." />
      <LazForm initialData={result.data} />
    </div>
  );
}
