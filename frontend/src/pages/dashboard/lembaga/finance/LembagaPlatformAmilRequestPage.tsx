import { PageHeader } from "@/components/ui";
import { PlatformAmilRequestForm } from "@/features/amil/components/PlatformAmilRequestForm";

export function LembagaPlatformAmilRequestPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan Amil Platform"
        description="Ajukan perubahan porsi amil platform untuk ditinjau oleh Ruang Berbagi."
      />
      <PlatformAmilRequestForm />
    </div>
  );
}
