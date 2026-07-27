import { LembagaForm } from "@/features/lembaga/components/LembagaForm";
import { PageHeader } from "@/components/ui";

export function NewLembagaPage() {
  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Tambah Lembaga Baru"
        description="Tambahkan organisasi lembaga/yayasan baru ke dalam platform."
      />
      <LembagaForm />
    </div>
  );
}
