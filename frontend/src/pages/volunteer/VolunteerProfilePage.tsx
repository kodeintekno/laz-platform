import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { VolunteerProfileForm } from "@/features/volunteers/components/VolunteerProfileForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function VolunteerProfilePage() {
  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["volunteer", "profile"],
    queryFn: () => api.get<any>("/volunteers/profile"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Profil Saya</h1>
        <p className="text-secondary mt-1">Kelola informasi profil relawan Anda.</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : isError || !result?.data ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">Gagal memuat profil.</div>
      ) : (
        <VolunteerProfileForm initialData={result.data} />
      )}
    </div>
  );
}
