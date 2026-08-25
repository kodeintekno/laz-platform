import { InstitutionAmilSettings } from "@/features/amil/components/InstitutionAmilSettings";

export function LembagaAmilSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Persentase Amil</h1>
        <p className="text-slate-500 mt-1">Kelola persentase pembagian dana amil operasional lembaga Anda.</p>
      </div>

      <InstitutionAmilSettings />
    </div>
  );
}
