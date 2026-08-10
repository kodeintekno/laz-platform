import { PageHeader } from "@/components/ui/PageHeader";

export function AccountingDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Akuntansi"
        description="Ringkasan aktivitas jurnal dan keuangan lembaga Anda."
      />
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface-border flex flex-col items-center justify-center min-h-[400px]">
        <h3 className="text-xl font-semibold text-primary mb-2">Segera Hadir</h3>
        <p className="text-secondary text-center max-w-md">
          Dashboard akuntansi sedang dalam tahap pengembangan. Fitur ini akan menampilkan grafik dan ringkasan keuangan berdasarkan data jurnal secara otomatis.
        </p>
      </div>
    </div>
  );
}
