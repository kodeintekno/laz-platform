import { LazForm } from "@/features/laz/components/LazForm";
import { PageHeader } from "@/components/ui";

export function NewLazPage() {
  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Daftarkan LAZ Baru"
        description="Tambahkan organisasi Lembaga Amil Zakat baru ke dalam platform."
      />
      <LazForm />
    </div>
  );
}
