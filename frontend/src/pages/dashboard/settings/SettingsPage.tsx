import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { SettingsForm } from "@/features/settings/components/SettingsForm";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function SettingsPage() {
  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<any>("/auth/me"),
  });

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pengaturan Akun"
          description="Kelola informasi profil Anda, ubah kata sandi, dan atur preferensi notifikasi di sini."
        />
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Gagal memuat profil pengguna. Silakan muat ulang halaman.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Akun"
        description="Kelola informasi profil Anda, ubah kata sandi, dan atur preferensi notifikasi di sini."
      />
      {isLoading || !result?.data ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : (
        <SettingsForm user={result.data} />
      )}
    </div>
  );
}
