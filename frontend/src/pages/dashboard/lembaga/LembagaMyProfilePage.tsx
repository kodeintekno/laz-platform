import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { LembagaProfileForm } from "@/features/lembaga/components/LembagaProfileForm";
import { PageHeader, EmptyState } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function LembagaMyProfilePage() {
  const { user } = useAuth();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["lembaga", "me"],
    queryFn: () => api.get<any>("/lembaga/me"),
    // Halaman ini hanya berlaku untuk staff yang terikat ke satu lembaga
    // (LEMBAGA_ADMIN). SUPER_ADMIN lolos permission check LEMBAGA_READ
    // secara otomatis tapi lembagaId-nya null — jangan panggil API sama
    // sekali untuk kasus itu, cukup tampilkan pesan yang jelas.
    enabled: !!user?.lembagaId,
  });

  if (!user?.lembagaId) {
    return (
      <div className="space-y-6 w-full">
        <PageHeader
          title="Profil Lembaga"
          description="Kelola informasi profil lembaga Anda yang ditampilkan kepada publik."
        />
        <EmptyState
          title="Halaman Ini Tidak Berlaku untuk Akun Anda"
          description="Profil Lembaga hanya tersedia untuk akun Admin Lembaga yang terhubung dengan satu lembaga tertentu. Akun Super Admin mengelola seluruh lembaga melalui menu Manajemen Lembaga."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Profil Lembaga"
        description="Kelola informasi profil lembaga Anda yang ditampilkan kepada publik."
      />
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : isError || !result?.data ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Gagal memuat profil lembaga. Silakan muat ulang halaman.
        </div>
      ) : (
        <LembagaProfileForm initialData={result.data} />
      )}
    </div>
  );
}
